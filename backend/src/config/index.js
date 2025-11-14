const dotenv = require('dotenv');
const validateEnv = require('./validateEnv');

dotenv.config();

const env = validateEnv();

const parseAllowedOrigins = () => {
  if (env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
  }
  return ['http://localhost', 'http://localhost:80', 'http://localhost:5173'];
};

const parseServerList = () => {
  if (env.PBI_SERVERS) {
    try {
      const parsed = JSON.parse(env.PBI_SERVERS);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  const legacy = [env.PBI_SERVER_URL_1, env.PBI_SERVER_URL_2, env.PBI_SERVER_URL_3]
    .filter(Boolean);
  return legacy;
};

const isLdapConfigured = () => (
  !!env.LDAP_URL &&
  !!env.LDAP_BIND_DN &&
  !!env.LDAP_BIND_PASSWORD &&
  !!env.LDAP_SEARCH_BASE
);

const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  cors: {
    allowedOrigins: parseAllowedOrigins()
  },
  rateLimit: {
    basePath: '/api/',
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX
  },
  http: {
    jsonLimit: '10mb',
    urlEncodedLimit: '10mb',
    compression: {
      level: 6,
      threshold: 1024
    },
    timeoutMs: 30000
  },
  powerBi: {
    domain: env.PBI_DOMAIN,
    username: env.PBI_USER,
    password: env.PBI_PASSWORD
  },
  ldap: {
    url: env.LDAP_URL || null,
    bindDN: env.LDAP_BIND_DN || null,
    bindPassword: env.LDAP_BIND_PASSWORD || null,
    searchBase: env.LDAP_SEARCH_BASE || null
  },
  servers: parseServerList(),
  adConfigAvailable: isLdapConfigured()
};

module.exports = config;

