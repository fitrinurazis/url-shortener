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
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (err) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const connection = await pool.getConnection();

    // Check if URL already exists in database
    const [existingUrls] = await connection.query(
      "SELECT * FROM urls WHERE original_url = ?",
      [originalUrl]
    );

    let shortCode;

    if (existingUrls.length > 0) {
      // URL already exists, use the existing short code
      shortCode = existingUrls[0].short_code;
    } else {
      // Generate a new short code
      shortCode = generateShortCode();

      // Insert the new URL into the database
      await connection.query(
        "INSERT INTO urls (original_url, short_code) VALUES (?, ?)",
        [originalUrl, shortCode]
      );
    }

    connection.release();

    const baseUrl =
      config.server.baseUrl || `http://localhost:${config.server.port}`;
    const shortUrl = `${baseUrl}/${shortCode}`;

    logInfo(`URL shortened: ${originalUrl} -> ${shortUrl}`);

    res.json({
      originalUrl,
      shortUrl,
      shortCode,
    });
  } catch (error) {
    logError(error, "Error shortening URL");
    res.status(500).json({ error: "Server error" });
  }
});

// Redirect to the original URL
router.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    const connection = await pool.getConnection();

    // Find the original URL in the database
    const [urls] = await connection.query(
      "SELECT * FROM urls WHERE short_code = ?",
      [shortCode]
    );

    if (urls.length === 0) {
      connection.release();
      return res.status(404).send("URL not found");
    }

    // Increment the click count
    await connection.query(
      "UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?",
      [shortCode]
    );

    connection.release();

    const originalUrl = urls[0].original_url;
    logInfo(`Redirecting ${shortCode} to ${originalUrl}`);

    // Instead of direct redirect, use HTML with meta refresh
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${originalUrl}">
          <title>Redirecting...</title>
        </head>
        <body>
          <p>Redirecting to ${originalUrl}...</p>
          <p>If you are not redirected automatically, <a href="${originalUrl}">click here</a>.</p>
          <script>window.location.href = "${originalUrl}";</script>
        </body>
      </html>
    `);
  } catch (error) {
    logError(error, "Error redirecting to URL");
    res.status(500).send("Server error");
  }
});

// Get URL stats
router.get("/api/stats/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    const connection = await pool.getConnection();

    // Find the URL stats in the database
    const [urls] = await connection.query(
      "SELECT * FROM urls WHERE short_code = ?",
      [shortCode]
    );

    connection.release();

    if (urls.length === 0) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json({
      shortCode,
      originalUrl: urls[0].original_url,
      clicks: urls[0].clicks,
      createdAt: urls[0].created_at,
    });
  } catch (error) {
    logError(error, "Error getting URL stats");
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
