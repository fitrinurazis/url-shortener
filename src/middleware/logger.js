const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(logsDir, "app.log");

function logError(error, message = "") {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.stack : String(error);
  const logEntry = `[${timestamp}] ERROR: ${message} - ${errorMessage}\n`;

  // Log to console
  console.error(logEntry);

  // Log to file
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) console.error("Failed to write to log file:", err);
  });
}

function logInfo(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] INFO: ${message}\n`;

  // Log to console
  console.log(logEntry);

  // Log to file
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) console.error("Failed to write to log file:", err);
  });
}

module.exports = { logError, logInfo };
