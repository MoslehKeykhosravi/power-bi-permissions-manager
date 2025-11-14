const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const rateLimiter = require('./config/rateLimiter');
const corsOptions = require('./config/corsOptions');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const requestTimeout = require('./middlewares/requestTimeout');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: config.http.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: config.http.urlEncodedLimit }));
app.use(compression({
  level: config.http.compression.level,
  threshold: config.http.compression.threshold,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(morgan('combined', { stream: logger.stream }));
app.use(requestTimeout);
app.use(config.rateLimit.basePath, rateLimiter);

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

