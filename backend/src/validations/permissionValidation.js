const { Joi, buildSchema } = require('./schemaFactory');
const { ROLE_NAMES } = require('../constants/roles');

const serverUriSchema = Joi.string().uri({ scheme: ['http', 'https'] }).required();

const getPermissions = buildSchema(Joi.object({
  serverUri: serverUriSchema,
  itemId: Joi.string().optional(),
  itemPath: Joi.string().optional()
}).or('itemId', 'itemPath'));

const checkPermissions = buildSchema(Joi.object({
  serverUri: serverUriSchema,
  userName: Joi.string().allow('').optional(),
  userNames: Joi.array().items(Joi.string().required()).min(1).optional()
}).custom((value, helpers) => {
  if ((!value.userName || value.userName.length === 0) && (!value.userNames || !value.userNames.length)) {
    return helpers.error('any.custom', { message: 'Either userName or userNames must be provided' });
  }
  return value;
}, 'user requirement'));

const setPermissions = buildSchema(Joi.object({
  serverUri: serverUriSchema,
  itemId: Joi.string().optional(),
  itemPath: Joi.string().optional(),
  itemType: Joi.string().allow('', null).optional(),
  userName: Joi.string().required(),
  roles: Joi.array().items(Joi.string().valid(...ROLE_NAMES)).optional().default([])
}).or('itemId', 'itemPath'));

module.exports = {
  getPermissions,
  checkPermissions,
  setPermissions
};

