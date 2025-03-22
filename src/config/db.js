const mysql = require("mysql2/promise");
const config = require("./config");

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create the URLs table if it doesn't exist
async function initDb() {
  try {
    const connection = await pool.getConnection();

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${config.db.database}`
    );
    await connection.query(`USE ${config.db.database}`);

    // Create URLs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_url VARCHAR(2083) NOT NULL,
        short_code VARCHAR(10) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        clicks INT DEFAULT 0
      )
    `);

    console.log("Database initialized successfully");
    connection.release();
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

module.exports = { pool, initDb };
