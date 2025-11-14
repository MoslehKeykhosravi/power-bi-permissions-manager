const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { startJobs } = require('./jobs');

const startServer = () => {
  app.listen(config.port, () => {
    logger.info(`🚀 PBI Permissions API Server running on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`CORS allowed origins: ${config.cors.allowedOrigins.join(', ')}`);
  });

  startJobs();
};

startServer();

