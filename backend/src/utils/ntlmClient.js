const httpntlm = require('httpntlm');
const config = require('../config');
const logger = require('./logger');
const AppError = require('../errors/AppError');

const DEFAULT_TIMEOUT_MS = 40_000;
const MAX_RETRIES = 2;

const buildOptions = (url, headers = {}) => ({
  url,
  username: config.powerBi.username,
  password: config.powerBi.password,
  workstation: '',
  domain: config.powerBi.domain,
  headers: {
    Accept: 'application/json; charset=utf-8',
    'Accept-Charset': 'utf-8',
    ...headers
  }
});

const shouldRetry = (error, statusCode, attempt) => {
  if (attempt >= MAX_RETRIES) {
    return false;
  }

  if (error && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'EAI_AGAIN')) {
    return true;
  }

  if ([500, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  return false;
};

const performRequest = (verb, options, timeoutMs) => (
  new Promise((resolve, reject) => {
    let timeoutHandle;

    const onComplete = (err, response) => {
      clearTimeout(timeoutHandle);
      if (err) {
        reject(err);
        return;
      }
      resolve(response);
    };

    const executor = httpntlm[verb];

    if (typeof executor !== 'function') {
      reject(new Error(`Unsupported NTLM method: ${verb}`));
      return;
    }

    timeoutHandle = setTimeout(() => {
      const timeoutError = new Error('NTLM request timed out');
      timeoutError.code = 'ETIMEDOUT';
      reject(timeoutError);
    }, timeoutMs);

    executor(options, onComplete);
  })
);

const request = async (method, url, { body, headers, parseJson = true, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const options = buildOptions(url, headers);
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json; charset=utf-8';
  }

  const verb = method.toLowerCase();
  let attempt = 0;
  let lastError = null;

  while (attempt <= MAX_RETRIES) {
    try {
      logger.debug(`[NTLM] Attempt ${attempt + 1} ${verb.toUpperCase()} ${url}`);
      const response = await performRequest(verb, options, timeoutMs);
      const { statusCode, statusMessage } = response;
      const success = [200, 201, 202, 204].includes(statusCode);

      if (!success) {
        const message = response.body
          ? (typeof response.body === 'string' ? response.body : JSON.stringify(response.body)).substring(0, 500)
          : statusMessage || 'Power BI server error';

        logger.warn(`[NTLM] ${verb.toUpperCase()} ${url} responded with ${statusCode}: ${message}`);

        if (shouldRetry(null, statusCode, attempt)) {
          attempt += 1;
          continue;
        }

        throw new AppError(statusCode, 'Power BI request failed', { endpoint: url, message });
      }

      if (!parseJson) {
        return response.body;
      }

      try {
        return typeof response.body === 'string'
          ? JSON.parse(response.body || '{}')
          : response.body;
      } catch (parseError) {
        logger.error(`[NTLM] JSON parse error for ${url}: ${parseError.message}`);
        throw new AppError(500, 'Invalid JSON response from Power BI server');
      }
    } catch (error) {
      lastError = error;
      logger.error(`[NTLM] ${verb.toUpperCase()} ${url} failed: ${error.message}`);

      if (shouldRetry(error, error.statusCode, attempt)) {
        attempt += 1;
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        continue;
      }

      throw error instanceof AppError ? error : new AppError(502, 'Power BI request failed', error.message);
    }
  }

  throw lastError || new AppError(504, 'Power BI request failed after retries');
};

module.exports = {
  get: (url, options = {}) => request('get', url, options),
  post: (url, options = {}) => request('post', url, options),
  put: (url, options = {}) => request('put', url, options),
  patch: (url, options = {}) => request('patch', url, options),
  delete: (url, options = {}) => request('delete', url, options)
};

