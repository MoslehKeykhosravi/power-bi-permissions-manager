const { Joi, buildSchema } = require('./schemaFactory');

const serverUriSchema = Joi.string().uri({ scheme: ['http', 'https'] }).required();

const listReports = buildSchema(Joi.object({
  serverUri: serverUriSchema
}));

const renameItem = buildSchema(Joi.object({
  serverUri: serverUriSchema,
  itemId: Joi.string().required(),
  itemType: Joi.string().required(),
  newName: Joi.string().min(1).max(260).required()
}));

module.exports = {
  listReports,
  renameItem
};

