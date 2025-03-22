const express = require("express");
const shortid = require("shortid");
const { pool } = require("../config/db");

const router = express.Router();

// Create a short URL
router.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "Original URL is required" });
  }

  try {
    // Check if URL already exists in database
    const [existingUrls] = await pool.query(
      "SELECT short_code FROM urls WHERE original_url = ?",
      [originalUrl]
    );

    if (existingUrls.length > 0) {
      return res.json({
        originalUrl,
        shortUrl: `${process.env.BASE_URL}/${existingUrls[0].short_code}`,
        shortCode: existingUrls[0].short_code,
      });
    }

    // Generate a new short code
    const shortCode = shortid.generate();

    // Save to database
    await pool.query(
      "INSERT INTO urls (original_url, short_code) VALUES (?, ?)",
      [originalUrl, shortCode]
    );

    return res.json({
      originalUrl,
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
      shortCode,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Redirect to original URL
router.get("/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const [urls] = await pool.query(
      "SELECT original_url FROM urls WHERE short_code = ?",
      [code]
    );

    if (urls.length === 0) {
      return res.status(404).json({ error: "URL not found" });
    }

    return res.redirect(urls[0].original_url);
  } catch (error) {
    console.error("Error redirecting to URL:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
