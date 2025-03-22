const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "url_shortener"}`
    );
    await connection.query(`USE ${process.env.DB_NAME || "url_shortener"}`);

    // Create URLs table with custom_code field
    await connection.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_url VARCHAR(2083) NOT NULL,
        short_code VARCHAR(10) NOT NULL UNIQUE,
        custom_code VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        clicks INT DEFAULT 0
      )
    `);

    // Check if custom_code column exists, if not add it
    try {
      await connection.query(`
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS custom_code VARCHAR(50) UNIQUE
      `);
    } catch (error) {
      // If database doesn't support "ADD COLUMN IF NOT EXISTS", use alternative approach
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM urls LIKE 'custom_code'
      `);

      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE urls ADD COLUMN custom_code VARCHAR(50) UNIQUE
        `);
      }
    }

    // Check if clicks column exists
    try {
      await connection.query(`
        ALTER TABLE urls ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0
      `);
    } catch (error) {
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM urls LIKE 'clicks'
      `);

      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE urls ADD COLUMN clicks INT DEFAULT 0
        `);
      }
    }

    console.log("Database initialized successfully");
    connection.release();
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

module.exports = { pool, initDb };
