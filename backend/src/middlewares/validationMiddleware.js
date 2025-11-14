const AppError = require('../errors/AppError');
const logger = require('../utils/logger');

const validationMiddleware = (schema) => (req, res, next) => {
  if (!schema) {
    next();
    return;
  }

  const data = {
    body: req.body,
    query: req.query,
    params: req.params
  };

  const { error, value } = schema.validate(data, { abortEarly: false, allowUnknown: true });

  if (error) {
    const details = error.details.map(detail => detail.message);
    logger.warn('Validation failed', {
      path: req.originalUrl,
      method: req.method,
      details
    });
    next(new AppError(400, 'Validation failed', details));
    return;
  }

  req.body = value.body;
  req.query = value.query;
  req.params = value.params;

  next();
};

module.exports = validationMiddleware;

