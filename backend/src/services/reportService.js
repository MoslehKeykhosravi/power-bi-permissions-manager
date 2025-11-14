const powerBiRepository = require('../repositories/powerBiRepository');
const { mapPowerBiItem } = require('../models/reportItem');
const logger = require('../utils/logger');
const AppError = require('../errors/AppError');

const listReports = async ({ serverUri }) => {
  const reports = [];
  const errors = [];

  const sources = [
    {
      type: 'Power BI (PBIX)',
      fetch: () => powerBiRepository.getPowerBiReports(serverUri)
    },
    {
      type: 'Paginated (RDL)',
      fetch: () => powerBiRepository.getPaginatedReports(serverUri)
    }
  ];

  const [pbixResult, rdlResult] = await Promise.allSettled(sources.map(source => source.fetch()));

  [pbixResult, rdlResult].forEach((result, index) => {
    const label = sources[index].type;
    if (result.status === 'fulfilled' && result.value?.value) {
      logger.info(`✓ Found ${result.value.value.length} ${label}`);
      result.value.value.forEach(item => reports.push(mapPowerBiItem(item, label)));
    } else if (result.status === 'rejected') {
      const message = `${label}: ${result.reason?.message || 'Unknown error'}`;
      logger.error(`✗ ${message}`);
      errors.push(message);
    }
  });

  return {
    success: true,
    reports,
    errors: errors.length ? errors : null,
    count: reports.length
  };
};

const renameFolder = async (serverUri, itemId, newName) => {
  const folder = await powerBiRepository.getFolderByPath(serverUri, itemId);
  if (!folder?.Id) {
    throw new AppError(404, 'Folder not found', { path: itemId });
  }
  await powerBiRepository.patchFolderById(serverUri, folder.Id, { Name: newName });
};

const attemptRenameReport = async (serverUri, itemId, newName) => {
  const attempts = [
    () => powerBiRepository.patchPowerBiReport(serverUri, itemId, { Name: newName }),
    () => powerBiRepository.patchRdlReport(serverUri, itemId, { Name: newName })
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }
};

const renameItem = async ({ serverUri, itemId, itemType, newName }) => {
  if (itemType === 'Folder') {
    await renameFolder(serverUri, itemId, newName);
  } else {
    await attemptRenameReport(serverUri, itemId, newName);
  }

  return {
    success: true,
    message: 'Item renamed successfully'
  };
};

module.exports = {
  listReports,
  renameItem
};

