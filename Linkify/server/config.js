require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  APP_NAME: process.env.APP_NAME || 'Notification Service',
  PORT: process.env.PORT || 5000,
  ENV: env,
  IS_PRODUCTION: env === 'production',
  IS_TEST: env === 'test',
  IS_DEVELOPMENT: env === 'development',

  API_VERSION: process.env.API_VERSION || 'v1',
  API_BASE_URL: process.env.API_BASE_URL || process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,

  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 27017,
    NAME: process.env.DB_NAME || 'notification_service',
    USER: process.env.DB_USER || '',
    PASSWORD: process.env.DB_PASSWORD || '',
    URI: process.env.MONGODB_URI || `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'notification_service'}`,
    OPTIONS: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      socketTimeoutMS: 45000
    }
  },

  JWT: {
    SECRET: process.env.JWT_SECRET_KEY || 'your-very-secure-secret-key',
    ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
    ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    ISSUER: process.env.JWT_ISSUER || 'notification-service',
    AUDIENCE: process.env.JWT_AUDIENCE || 'notification-client'
  },

  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN || '*',
    METHODS: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
    CREDENTIALS: process.env.CORS_CREDENTIALS === 'true' || true
  },

  RATE_LIMIT: {
    WINDOW_MS: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000,
    MAX: process.env.RATE_LIMIT_MAX || 100
  },

  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    DIR: process.env.LOG_DIR || 'logs',
    MAX_SIZE: process.env.LOG_MAX_SIZE || '5m',
    MAX_FILES: process.env.LOG_MAX_FILES || '14d',
    COLORIZE: process.env.LOG_COLORIZE !== 'false'
  },

  SOCKET: {
    PING_TIMEOUT: process.env.SOCKET_PING_TIMEOUT || 10000,
    PING_INTERVAL: process.env.SOCKET_PING_INTERVAL || 5000,
    COOKIE: process.env.SOCKET_COOKIE || 'io',
    PATH: process.env.SOCKET_PATH || '/socket.io',
    SERVE_CLIENT: process.env.SOCKET_SERVE_CLIENT !== 'false',
    CONNECT_TIMEOUT: process.env.SOCKET_CONNECT_TIMEOUT || 45000
  },

  NOTIFICATION: {
    DEFAULT_EXPIRY_DAYS: process.env.NOTIFICATION_EXPIRY_DAYS || 30,
    PRIORITY_LEVELS: {
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3
    },
    BATCH_SIZE: process.env.NOTIFICATION_BATCH_SIZE || 100
  },

  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: process.env.REDIS_PORT || 6379,
    PASSWORD: process.env.REDIS_PASSWORD || '',
    DB: process.env.REDIS_DB || 0
  }
};

const envConfig = {
  production: {
    DB: {
      ...baseConfig.DB,
      OPTIONS: {
        ...baseConfig.DB.OPTIONS,
        ssl: true,
        sslValidate: true,
        replicaSet: process.env.DB_REPLICA_SET || 'rs0',
        readPreference: 'secondaryPreferred'
      }
    },
    LOGGING: {
      ...baseConfig.LOGGING,
      LEVEL: 'warn'
    },
    SOCKET: {
      ...baseConfig.SOCKET,
      COOKIE: true,
      SERVE_CLIENT: false
    }
  },
  test: {
    DB: {
      ...baseConfig.DB,
      NAME: process.env.DB_NAME || 'notification_service_test'
    },
    LOGGING: {
      ...baseConfig.LOGGING,
      LEVEL: 'error'
    }
  },
  development: {
    LOGGING: {
      ...baseConfig.LOGGING,
      LEVEL: 'debug'
    }
  }
};

const config = {
  ...baseConfig,
  ...(envConfig[env] || {})
};

config.getMongoUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (config.DB.USER && config.DB.PASSWORD) {
    return `mongodb://${config.DB.USER}:${encodeURIComponent(config.DB.PASSWORD)}@${config.DB.HOST}:${config.DB.PORT}/${config.DB.NAME}?authSource=admin`;
  }
  return config.DB.URI;
};

config.getRedisConfig = () => ({
  host: config.REDIS.HOST,
  port: config.REDIS.PORT,
  password: config.REDIS.PASSWORD,
  db: config.REDIS.DB
});

if (config.IS_PRODUCTION) {
  const required = ['JWT_SECRET_KEY', 'MONGODB_URI', 'FRONTEND_ORIGIN'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
  }
}

module.exports = config;
