const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { initDb } = require("./config/db");
const urlRoutes = require("./routes/url");
const config = require("./config/config");

const app = express();
const PORT = config.server.port;

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
  console.log(`Visit ${config.server.baseUrl} to use the URL shortener`);
});
