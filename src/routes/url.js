const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { nanoid } = require("nanoid");
const { logInfo, logError } = require("../middleware/logger");
const config = require("../config/config");

// Generate a short code
function generateShortCode() {
  return nanoid(6); // Generate a 6-character unique ID
}

// Create a shortened URL
router.post("/shorten", async (req, res) => {
  try {
    const { originalUrl, customCode } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (err) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Validate custom code if provided
    if (customCode && !/^[a-zA-Z0-9-_]+$/.test(customCode)) {
      return res.status(400).json({
        error:
          "Custom URL can only contain letters, numbers, hyphens, and underscores",
      });
    }

    const connection = await pool.getConnection();

    // If custom code is provided, check if it's already taken
    if (customCode) {
      const [existingCustom] = await connection.query(
        "SELECT * FROM urls WHERE custom_code = ?",
        [customCode]
      );

      if (existingCustom.length > 0) {
        connection.release();
        return res
          .status(400)
          .json({ error: "This custom URL is already taken" });
      }
    }

    // Check if URL already exists in database
    const [existingUrls] = await connection.query(
      "SELECT * FROM urls WHERE original_url = ?",
      [originalUrl]
    );

    let shortCode;
    let finalCustomCode = customCode;

    if (existingUrls.length > 0 && !customCode) {
      // URL already exists and no custom code requested, use the existing short code
      shortCode = existingUrls[0].short_code;
      finalCustomCode = existingUrls[0].custom_code;
    } else {
      // Generate a new short code
      shortCode = generateShortCode();

      // Insert the new URL into the database
      await connection.query(
        "INSERT INTO urls (original_url, short_code, custom_code) VALUES (?, ?, ?)",
        [originalUrl, shortCode, finalCustomCode]
      );
    }

    connection.release();

    const baseUrl =
      config.server.baseUrl || `http://localhost:${config.server.port}`;
    const shortUrl = finalCustomCode
      ? `${baseUrl}/${finalCustomCode}`
      : `${baseUrl}/${shortCode}`;

    logInfo(`URL shortened: ${originalUrl} -> ${shortUrl}`);

    res.json({
      originalUrl,
      shortUrl,
      shortCode,
      customCode: finalCustomCode,
    });
  } catch (error) {
    logError(error, "Error shortening URL");
    res.status(500).json({ error: "Server error" });
  }
});

// Redirect to the original URL - handle both short codes and custom codes
router.get("/:code", async (req, res) => {
  try {
    const code = req.params.code;

    const connection = await pool.getConnection();

    // Find the original URL in the database - check both short_code and custom_code
    const [urls] = await connection.query(
      "SELECT * FROM urls WHERE short_code = ? OR custom_code = ?",
      [code, code]
    );

    if (urls.length === 0) {
      connection.release();
      return res.status(404).send("URL not found");
    }

    // Increment the click count
    await connection.query("UPDATE urls SET clicks = clicks + 1 WHERE id = ?", [
      urls[0].id,
    ]);

    connection.release();

    const originalUrl = urls[0].original_url;
    logInfo(`Redirecting ${code} to ${originalUrl}`);

    // Send HTML with JavaScript redirect instead of HTTP redirect
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <meta name="robots" content="noindex">
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
              background: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .redirect-link {
              color: #2980b9;
              text-decoration: none;
              font-weight: bold;
            }
            .redirect-link:hover {
              text-decoration: underline;
            }
            .url {
              word-break: break-all;
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              margin: 15px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Redirecting you to:</h2>
            <div class="url">${originalUrl}</div>
            <p>If you are not redirected automatically, <a href="${originalUrl}" class="redirect-link">click here</a>.</p>
          </div>
          <script>
            // Small delay to ensure the page loads before redirecting
            setTimeout(function() {
              window.location.href = "${originalUrl}";
            }, 500);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    logError(error, "Error redirecting to URL");
    res.status(500).send("Server error");
  }
});

// Get URL stats
router.get("/api/stats/:code", async (req, res) => {
  try {
    const code = req.params.code;

    const connection = await pool.getConnection();

    // Find the URL stats in the database - check both short_code and custom_code
    const [urls] = await connection.query(
      "SELECT * FROM urls WHERE short_code = ? OR custom_code = ?",
      [code, code]
    );

    connection.release();

    if (urls.length === 0) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json({
      shortCode: urls[0].short_code,
      customCode: urls[0].custom_code,
      originalUrl: urls[0].original_url,
      clicks: urls[0].clicks,
      createdAt: urls[0].created_at,
    });
  } catch (error) {
    logError(error, "Error getting URL stats");
    res.status(500).json({ error: "Server error" });
  }
});

// Check if a custom code is available
router.get("/api/check-availability", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Code parameter is required" });
    }

    // Validate format
    if (!/^[a-zA-Z0-9-_]+$/.test(code)) {
      return res.json({ available: false, error: "Invalid format" });
    }

    const connection = await pool.getConnection();

    // Check if code exists in either short_code or custom_code
    const [existing] = await connection.query(
      "SELECT * FROM urls WHERE short_code = ? OR custom_code = ?",
      [code, code]
    );

    connection.release();

    res.json({
      available: existing.length === 0,
    });
  } catch (error) {
    logError(error, "Error checking code availability");
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
