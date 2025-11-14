const reportService = require('../services/reportService');

const listReports = async (req, res) => {
  const payload = await reportService.listReports(req.body);
  res.json(payload);
};

const renameItem = async (req, res) => {
  const payload = await reportService.renameItem(req.body);
  res.json(payload);
};

module.exports = {
  listReports,
  renameItem
};

