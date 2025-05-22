// server/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info', // Logging level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    new winston.transports.File({ filename: 'logs/server.log' }) // Log to a file
  ],
});

module.exports = logger;