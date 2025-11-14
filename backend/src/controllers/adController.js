const adService = require('../services/adService');

const search = async (req, res) => {
  const payload = await adService.searchDirectory(req.body);
  res.json(payload);
};

const getUserDetails = async (req, res) => {
  const payload = await adService.getUserDetails(req.body);
  res.json(payload);
};

const getGroupMembers = async (req, res) => {
  const payload = await adService.getGroupMembers(req.body);
  res.json(payload);
};

const getDirectReports = async (req, res) => {
  const payload = await adService.getDirectReports(req.body);
  res.json(payload);
};

const getManagerChain = async (req, res) => {
  const payload = await adService.getManagerChain(req.body);
  res.json(payload);
};

const searchByDepartment = async (req, res) => {
  const payload = await adService.searchByDepartment(req.body);
  res.json(payload);
};

const getDepartments = async (req, res) => {
  const payload = await adService.getAllDepartments(req.body);
  res.json(payload);
};

const getLocations = async (req, res) => {
  const payload = await adService.getAllLocations(req.body);
  res.json(payload);
};

module.exports = {
  search,
  getUserDetails,
  getGroupMembers,
  getDirectReports,
  getManagerChain,
  searchByDepartment,
  getDepartments,
  getLocations
};

