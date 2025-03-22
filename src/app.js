const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { initDb } = require("./config/db");
const urlRoutes = require("./routes/url");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "pages")));

// Routes
app.use("/", urlRoutes);

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit ${process.env.BASE_URL} to use the URL shortener`);
});
