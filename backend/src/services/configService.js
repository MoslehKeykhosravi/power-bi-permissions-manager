const config = require('../config');

const getServerConfig = () => ({
  success: true,
  servers: config.servers,
  adConfig: config.adConfigAvailable
    ? {
        available: true
      }
    : null
});

module.exports = {
  getServerConfig
};

