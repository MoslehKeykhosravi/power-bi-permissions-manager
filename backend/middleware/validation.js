const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Input Validation Middleware
 * Uses Joi for schema validation
 */

/**
 * Generic validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn(`Validation error: ${errorMessage}`);
      
      return res.status(400).json({
        error: 'Validation Error',
        message: errorMessage,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Validation Schemas

const serverUriSchema = Joi.string().uri().required().messages({
  'string.uri': 'Server URI must be a valid URL',
  'any.required': 'Server URI is required'
});

const schemas = {
  // Reports list validation
  reportsList: Joi.object({
    serverUri: serverUriSchema
  }),

  // Reports rename validation
  reportsRename: Joi.object({
    serverUri: serverUriSchema,
    itemId: Joi.string().required(),
    itemType: Joi.string().valid('Folder', 'Report', 'Power BI (PBIX)', 'Paginated (RDL)'),
    newName: Joi.string().min(1).max(255).required().messages({
      'string.min': 'New name must not be empty',
      'string.max': 'New name must not exceed 255 characters'
    })
  }),

  // Permissions get validation
  permissionsGet: Joi.object({
    serverUri: serverUriSchema,
    itemId: Joi.string().when('itemPath', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    }),
    itemPath: Joi.string().optional()
  }).or('itemId', 'itemPath').messages({
    'object.missing': 'Either itemId or itemPath must be provided'
  }),

  // Permissions set validation
  permissionsSet: Joi.object({
    serverUri: serverUriSchema,
    itemId: Joi.string().optional(),
    itemPath: Joi.string().optional(),
    userName: Joi.string().required().messages({
      'any.required': 'Username is required'
    }),
    roles: Joi.array().items(
      Joi.string().valid('Browser', 'Content Manager', 'My Reports', 'Publisher', 'Report Builder')
    ).min(1).required().messages({
      'array.min': 'At least one role must be selected',
      'any.only': 'Invalid role specified'
    }),
    itemType: Joi.string().optional()
  }).or('itemId', 'itemPath'),

  // Permissions check validation
  permissionsCheck: Joi.object({
    serverUri: serverUriSchema,
    userName: Joi.string().required().messages({
      'any.required': 'Username is required for permission check'
    })
  }),

  // AD search validation
  adSearch: Joi.object({
    ldapUrl: Joi.string().uri({ scheme: ['ldap', 'ldaps'] }).required(),
    bindDN: Joi.string().required(),
    bindPassword: Joi.string().required(),
    searchBase: Joi.string().required(),
    searchFilter: Joi.string().default('*').optional()
  })
};

module.exports = {
  validate,
  schemas
};

