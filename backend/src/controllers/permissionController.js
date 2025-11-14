const permissionService = require('../services/permissionService');

const getPermissions = async (req, res) => {
  const payload = await permissionService.getPermissions(req.body);
  res.json(payload);
};

const checkPermissions = async (req, res) => {
  const payload = await permissionService.checkPermissions({
    serverUri: req.body.serverUri,
    users: req.body.userNames?.length ? req.body.userNames : [req.body.userName]
  });
  res.json(payload);
};

const setPermissions = async (req, res) => {
  const payload = await permissionService.setPermissions(req.body);
  res.json(payload);
};

module.exports = {
  getPermissions,
  checkPermissions,
  setPermissions
};

