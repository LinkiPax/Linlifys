const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const config = require('../config'); // Assuming you have a config file

// Define custom log levels
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
  }
};

// Add colors
winston.addColors(logLevels.colors);

// Create a format for console logging
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, correlationId, ...metadata }) => {
    let msg = `${timestamp} [${level}]`;
    if (correlationId) msg += ` [${correlationId}]`;
    msg += `: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Create a format for file logging (more detailed)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  level: config.LOG_LEVEL || 'info',
  defaultMeta: { service: 'notification-service' },
  transports: [
    // Console transport (colorized, human-readable)
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // HTTP request logging
    new winston.transports.File({
      filename: 'logs/http.log',
      level: 'http',
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Add a stream for morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Create a child logger with correlation ID
logger.child = (correlationId = uuidv4()) => {
  return logger.child({ correlationId });
};

// Custom logging methods for our notification system
logger.notification = {
  created: (notification, userId, correlationId) => {
    logger.info(`Notification created`, { 
      notificationId: notification._id,
      type: notification.type,
      userId,
      correlationId 
    });
  },
  
  read: (notificationId, userId, correlationId) => {
    logger.info(`Notification marked as read`, { 
      notificationId,
      userId,
      correlationId 
    });
  },
  
  error: (error, context, correlationId) => {
    logger.error(`Notification error: ${error.message}`, { 
      error: error.stack,
      context,
      correlationId 
    });
  },
  
  socket: (event, socketId, userId, data = {}) => {
    logger.debug(`Socket event: ${event}`, {
      socketId,
      userId,
      ...data
    });
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.stack });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { 
    reason: reason.stack || reason,
    promise 
  });
});

module.exports = logger;