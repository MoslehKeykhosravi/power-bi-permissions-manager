const logger = require('../utils/logger');

const jobs = [];

/**
 * Register a background job.
 * @param {string} name - Friendly job name for logging.
 * @param {Function} initializer - Function that wires timers/queues for the job.
 */
const registerJob = (name, initializer) => {
  if (typeof initializer !== 'function') {
    throw new Error(`Job "${name}" must provide an initializer function.`);
  }
  jobs.push({ name, initializer });
};

const startJobs = () => {
  if (!jobs.length) {
    logger.info('[Jobs] No recurring jobs configured. Add jobs via registerJob in src/jobs/index.js.');
    return;
  }

  jobs.forEach(({ name, initializer }) => {
    try {
      initializer();
      logger.info(`[Jobs] Started "${name}".`);
    } catch (error) {
      logger.error(`[Jobs] Failed to initialize "${name}": ${error.message}`, { error });
    }
  });
};

module.exports = {
  registerJob,
  startJobs
};

