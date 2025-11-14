const config = require('../config');

const requestTimeout = (req, res, next) => {
  req.setTimeout(config.http.timeoutMs);
  res.setTimeout(config.http.timeoutMs);
  next();
};

module.exports = requestTimeout;

