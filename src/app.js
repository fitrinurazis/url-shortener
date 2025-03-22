const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { initDb } = require("./config/db");
const urlRoutes = require("./routes/url");
const { logError } = require("./middleware/logger");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "pages")));

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

// Gunakan router untuk endpoint API
app.use("/", urlRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Error handler
app.use((err, req, res, next) => {
  logError(err, "Server error");
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Visit ${
      process.env.BASE_URL || "https://url.kujaw.my.id"
    } to use the URL shortener`
  );
});
