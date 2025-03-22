require("dotenv").config();

const config = {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  server: {
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL,
  },
};

module.exports = config;
