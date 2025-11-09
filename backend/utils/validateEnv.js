const Joi = require('joi');
const logger = require('./logger');

/**
 * Environment Variables Validation
 * Validates required environment variables on startup
 */

const envSchema = Joi.object({
  // Server configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(5000),

  // CORS configuration
  ALLOWED_ORIGINS: Joi.string()
    .optional()
    .description('Comma-separated list of allowed origins'),

  // Power BI credentials (REQUIRED)
  PBI_DOMAIN: Joi.string()
    .required()
    .messages({
      'any.required': 'PBI_DOMAIN is required in environment variables'
    }),
  
  PBI_USER: Joi.string()
    .required()
    .messages({
      'any.required': 'PBI_USER is required in environment variables'
    }),
  
  PBI_PASSWORD: Joi.string()
    .required()
    .messages({
      'any.required': 'PBI_PASSWORD is required in environment variables'
    }),

  // Power BI Server URLs
  PBI_SERVER_URL_1: Joi.string().uri().optional(),
  PBI_SERVER_URL_2: Joi.string().uri().optional(),
  PBI_SERVER_URL_3: Joi.string().uri().optional(),

  // Active Directory configuration (OPTIONAL)
  LDAP_URL: Joi.string().uri({ scheme: ['ldap', 'ldaps'] }).optional(),
  LDAP_BIND_DN: Joi.string().optional(),
  LDAP_BIND_PASSWORD: Joi.string().optional(),
  LDAP_SEARCH_BASE: Joi.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().optional().default(900000),
  RATE_LIMIT_MAX: Joi.number().optional().default(100),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'debug')
    .optional()
    .default('info')

}).unknown(true); // Allow other environment variables

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 */
function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const errorMessages = error.details.map(detail => {
      return `  - ${detail.message}`;
    }).join('\n');

    logger.error('❌ Environment validation failed:');
    logger.error(errorMessages);
    logger.error('\nPlease check your .env file and ensure all required variables are set.');
    
    throw new Error('Environment validation failed. Check logs for details.');
  }

  // Log successful validation
  logger.info('✅ Environment variables validated successfully');
  
  // Log configuration (without sensitive data)
  logger.info('Configuration:');
  logger.info(`  - NODE_ENV: ${value.NODE_ENV}`);
  logger.info(`  - PORT: ${value.PORT}`);
  logger.info(`  - PBI_DOMAIN: ${value.PBI_DOMAIN}`);
  logger.info(`  - PBI_USER: ${value.PBI_USER}`);
  logger.info(`  - LDAP configured: ${value.LDAP_URL ? 'Yes' : 'No'}`);
  
  // Warn if AD is not configured
  if (!value.LDAP_URL || !value.LDAP_BIND_DN || !value.LDAP_BIND_PASSWORD || !value.LDAP_SEARCH_BASE) {
    logger.warn('⚠️  Active Directory (LDAP) is not fully configured');
    logger.warn('   AD search functionality will be limited');
  }

  return value;
}

module.exports = validateEnv;

