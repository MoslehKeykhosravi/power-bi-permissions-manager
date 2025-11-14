const Joi = require('joi');

const buildSchema = (bodySchema) => Joi.object({
  body: bodySchema,
  query: Joi.object().unknown(true).default({}),
  params: Joi.object().unknown(true).default({})
});

module.exports = {
  Joi,
  buildSchema
};

