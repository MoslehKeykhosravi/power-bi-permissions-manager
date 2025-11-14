const { Joi, buildSchema } = require('./schemaFactory');

const ldapConfig = {
  ldapUrl: Joi.string().uri({ scheme: ['ldap', 'ldaps'] }).optional(),
  bindDN: Joi.string().optional(),
  bindPassword: Joi.string().optional(),
  searchBase: Joi.string().optional()
};

const search = buildSchema(Joi.object({
  ...ldapConfig,
  searchFilter: Joi.string().optional().allow('')
}));

const userDetails = buildSchema(Joi.object({
  ...ldapConfig,
  userName: Joi.string().required()
}));

const groupMembers = buildSchema(Joi.object({
  ...ldapConfig,
  groupName: Joi.string().required()
}));

const directReports = userDetails;
const managerChain = userDetails;

const departmentSearch = buildSchema(Joi.object({
  ...ldapConfig,
  department: Joi.string().required()
}));

const simpleConfig = buildSchema(Joi.object({
  ...ldapConfig
}));

module.exports = {
  search,
  userDetails,
  groupMembers,
  directReports,
  managerChain,
  departmentSearch,
  simpleConfig
};

