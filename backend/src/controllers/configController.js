const configService = require('../services/configService');

const getServers = async (req, res) => {
  const payload = configService.getServerConfig();
  res.json(payload);
};

module.exports = {
  getServers
};

