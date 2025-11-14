const ntlmClient = require('../utils/ntlmClient');

const join = (serverUri, path) => `${serverUri.replace(/\/$/, '')}${path}`;

const escapePath = (path) => (path || '/').replace(/'/g, "''");

const encodePath = (path) => encodeURIComponent(escapePath(path));

const getPowerBiReports = (serverUri) =>
  ntlmClient.get(join(serverUri, '/api/v2.0/PowerBIReports'));

const getPaginatedReports = (serverUri) =>
  ntlmClient.get(join(serverUri, '/api/v2.0/Reports'));

const getCatalogItems = (serverUri) =>
  ntlmClient.get(join(serverUri, '/api/v2.0/CatalogItems'));

const getPowerBiPoliciesById = (serverUri, itemId) =>
  ntlmClient.get(join(serverUri, `/api/v2.0/PowerBIReports(${itemId})/Policies`));

const getCatalogPoliciesById = (serverUri, itemId) =>
  ntlmClient.get(join(serverUri, `/api/v2.0/CatalogItems(${itemId})/Policies`));

const getCatalogPoliciesByPath = (serverUri, path, encode = false) =>
  ntlmClient.get(join(serverUri, `/api/v2.0/CatalogItems(Path='${encode ? encodePath(path) : escapePath(path)}')/Policies`));

const setPoliciesByPowerBiId = (serverUri, itemId, body) =>
  ntlmClient.put(join(serverUri, `/api/v2.0/PowerBIReports(${itemId})/Policies`), { body });

const setPoliciesByCatalogId = (serverUri, itemId, body) =>
  ntlmClient.put(join(serverUri, `/api/v2.0/CatalogItems(${itemId})/Policies`), { body });

const setPoliciesByPath = (serverUri, path, body, encode = false) =>
  ntlmClient.put(join(serverUri, `/api/v2.0/CatalogItems(Path='${encode ? encodePath(path) : escapePath(path)}')/Policies`), { body });

const getFolderByPath = (serverUri, path) =>
  ntlmClient.get(join(serverUri, `/api/v2.0/Folders(Path='${escapePath(path)}')`));

const patchFolderById = (serverUri, folderId, body) =>
  ntlmClient.patch(join(serverUri, `/api/v2.0/Folders(${folderId})`), { body });

const patchPowerBiReport = (serverUri, itemId, body) =>
  ntlmClient.patch(join(serverUri, `/api/v2.0/PowerBIReports(${itemId})`), { body });

const patchRdlReport = (serverUri, itemId, body) =>
  ntlmClient.patch(join(serverUri, `/api/v2.0/Reports(${itemId})`), { body });

module.exports = {
  getPowerBiReports,
  getPaginatedReports,
  getCatalogItems,
  getPowerBiPoliciesById,
  getCatalogPoliciesById,
  getCatalogPoliciesByPath,
  setPoliciesByPowerBiId,
  setPoliciesByCatalogId,
  setPoliciesByPath,
  getFolderByPath,
  patchFolderById,
  patchPowerBiReport,
  patchRdlReport
};

