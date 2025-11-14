const Joi = require('joi');
const logger = require('../utils/logger');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(5000),
  ALLOWED_ORIGINS: Joi.string().optional(),
  PBI_DOMAIN: Joi.string().required().messages({
    'any.required': 'PBI_DOMAIN is required in environment variables'
  }),
  PBI_USERNAME: Joi.string().optional(),
  PBI_USER: Joi.string().when('PBI_USERNAME', {
    is: Joi.exist(),
    then: Joi.string().optional(),
    otherwise: Joi.string().required()
  }).messages({
    'any.required': 'PBI_USER (or legacy PBI_USERNAME) is required in environment variables'
  }),
  PBI_PASSWORD: Joi.string().required().messages({
    'any.required': 'PBI_PASSWORD is required in environment variables'
  }),
  PBI_SERVER_URL_1: Joi.string().uri().optional(),
  PBI_SERVER_URL_2: Joi.string().uri().optional(),
  PBI_SERVER_URL_3: Joi.string().uri().optional(),
  PBI_SERVERS: Joi.string().optional(),
  LDAP_URL: Joi.string().uri({ scheme: ['ldap', 'ldaps'] }).optional(),
  LDAP_BIND_DN: Joi.string().optional(),
  LDAP_BIND_PASSWORD: Joi.string().optional(),
  LDAP_SEARCH_BASE: Joi.string().optional(),
  RATE_LIMIT_WINDOW_MS: Joi.number().optional().default(900000),
  RATE_LIMIT_MAX: Joi.number().optional().default(100),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').optional().default('info')
}).unknown(true);

function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const details = error.details.map(detail => `  - ${detail.message}`).join('\n');
    logger.error('❌ Environment validation failed:\n%s', details);
    logger.error('Please check your .env file and ensure all required variables are set.');
    throw new Error('Environment validation failed. Check logs for details.');
  }

  logger.info('✅ Environment variables validated successfully');
  logger.info('Configuration Snapshot:');
  logger.info(`  - NODE_ENV: ${value.NODE_ENV}`);
  logger.info(`  - PORT: ${value.PORT}`);
  logger.info(`  - PBI_DOMAIN: ${value.PBI_DOMAIN}`);
  if (!value.PBI_USER && value.PBI_USERNAME) {
    value.PBI_USER = value.PBI_USERNAME;
  }

  if (!value.PBI_USER) {
    throw new Error('Environment validation failed. Missing PBI_USER or PBI_USERNAME.');
  }

  logger.info(`  - PBI_USER: ${value.PBI_USER}`);
  logger.info(`  - LDAP configured: ${value.LDAP_URL ? 'Yes' : 'No'}`);

  if (!value.LDAP_URL || !value.LDAP_BIND_DN || !value.LDAP_BIND_PASSWORD || !value.LDAP_SEARCH_BASE) {
    logger.warn('⚠️  Active Directory (LDAP) is not fully configured');
    logger.warn('    AD search functionality will be limited');
  }

  return value;
}

module.exports = validateEnv;

