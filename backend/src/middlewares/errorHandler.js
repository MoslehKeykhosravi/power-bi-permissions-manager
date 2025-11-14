const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.statusCode || 500;
  const payload = {
    error: status === 500 ? 'Internal Server Error' : err.message
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && status === 500) {
    payload.stack = err.stack;
  }

  const logPayload = {
    status,
    path: req.originalUrl,
    method: req.method,
    details: err.details,
    stack: err.stack
  };

  if (status >= 500) {
    logger.error(`Error: ${err.message}`, logPayload);
  } else {
    logger.warn(`Client error: ${err.message}`, logPayload);
  }

  res.status(status).json(payload);
};

module.exports = errorHandler;

