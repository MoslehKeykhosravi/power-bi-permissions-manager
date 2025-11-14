const winston = require('winston');

/**
 * Centralized Logger Configuration
 * Provides structured logging across the backend layers
 */

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const resolveLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : (process.env.LOG_LEVEL || 'info');
};

const transports = [
  new winston.transports.Console({
    format: consoleFormat
  })
];

const logger = winston.createLogger({
  level: resolveLevel(),
  levels,
  format: baseFormat,
  transports,
  exitOnError: false
});

logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;

