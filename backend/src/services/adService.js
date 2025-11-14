const ldapRepository = require('../repositories/ldapRepository');
const logger = require('../utils/logger');
const AppError = require('../errors/AppError');
const config = require('../config');

const resolveLdapConfig = (payload) => {
  const ldapConfig = {
    ldapUrl: payload.ldapUrl || config.ldap.url,
    bindDN: payload.bindDN || config.ldap.bindDN,
    bindPassword: payload.bindPassword || config.ldap.bindPassword,
    searchBase: payload.searchBase || config.ldap.searchBase
  };

  if (!ldapConfig.ldapUrl || !ldapConfig.bindDN || !ldapConfig.bindPassword || !ldapConfig.searchBase) {
    throw new AppError(400, 'Active Directory configuration is required', {
      missing: {
        ldapUrl: !ldapConfig.ldapUrl,
        bindDN: !ldapConfig.bindDN,
        bindPassword: !ldapConfig.bindPassword,
        searchBase: !ldapConfig.searchBase
      }
    });
  }

  return ldapConfig;
};

const withLdapClient = async ({ ldapUrl, bindDN, bindPassword }, handler) => {
  let client;
  try {
    client = await ldapRepository.createLdapClient(ldapUrl, bindDN, bindPassword);
    return await handler(client);
  } finally {
    if (client) {
      client.unbind();
    }
  }
};

const searchDirectory = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const { ldapUrl, bindDN, bindPassword, searchBase, searchFilter = '*' } = {
    ...ldapConfig,
    searchFilter: payload.searchFilter || '*'
  };
  const maxResults = 500;
  const results = [];

  const searchPattern = searchFilter.includes('*') ? searchFilter : `*${searchFilter}*`;

  const executeSearch = async (client, filter, attributes) => {
    const options = {
      filter,
      scope: 'sub',
      attributes,
      sizeLimit: maxResults
    };
    return ldapRepository.ldapSearch(client, searchBase, options);
  };

  await withLdapClient({ ldapUrl, bindDN, bindPassword }, async (client) => {
    const userEntries = await executeSearch(
      client,
      `(&(objectCategory=person)(objectClass=user)(|(cn=${searchPattern})(sAMAccountName=${searchPattern})(displayName=${searchPattern})))`,
      ['sAMAccountName', 'displayName', 'department', 'cn', 'userAccountControl']
    );

    userEntries.forEach((entry) => {
      try {
        const sAMAccountName = ldapRepository.getAttribute(entry, 'sAMAccountName');
        const displayName = ldapRepository.getAttribute(entry, 'displayName');
        const department = ldapRepository.getAttribute(entry, 'department');
        const userAccountControl = ldapRepository.getAttribute(entry, 'userAccountControl');
        const uac = parseInt(userAccountControl || '0', 10);
        const isActive = !(uac & 0x0002);

        if (sAMAccountName) {
          results.push({
            name: sAMAccountName,
            displayText: `${displayName || sAMAccountName} (${sAMAccountName})${department ? ` [${department}]` : ''}`,
            type: 'User',
            isActive
          });
        }
      } catch (error) {
        logger.warn(`Error processing AD user entry: ${error.message}`);
      }
    });

    const groupEntries = await executeSearch(
      client,
      `(&(objectCategory=group)(|(cn=${searchPattern})(sAMAccountName=${searchPattern})(name=${searchPattern})))`,
      ['sAMAccountName', 'name', 'description', 'cn']
    );

    groupEntries.forEach((entry) => {
      try {
        const sAMAccountName = ldapRepository.getAttribute(entry, 'sAMAccountName');
        const name = ldapRepository.getAttribute(entry, 'name');
        const description = ldapRepository.getAttribute(entry, 'description');

        if (sAMAccountName) {
          results.push({
            name: sAMAccountName,
            displayText: `${name || sAMAccountName}${description ? ` - ${description}` : ''}`,
            type: 'Group'
          });
        }
      } catch (error) {
        logger.warn(`Error processing AD group entry: ${error.message}`);
      }
    });
  });

  return {
    success: true,
    results,
    count: results.length
  };
};

const getUserDetails = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const user = await ldapRepository.getUserDetails(
    ldapConfig.ldapUrl,
    ldapConfig.bindDN,
    ldapConfig.bindPassword,
    ldapConfig.searchBase,
    payload.userName,
    { reuse: true }
  );

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return {
    success: true,
    user
  };
};

const getGroupMembers = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const response = await ldapRepository.getGroupMembers(
    ldapConfig.ldapUrl,
    ldapConfig.bindDN,
    ldapConfig.bindPassword,
    ldapConfig.searchBase,
    payload.groupName,
    { reuse: true }
  );

  if (!response.group) {
    throw new AppError(404, 'Group not found');
  }

  return {
    success: true,
    group: response.group,
    members: response.members,
    count: response.members.length
  };
};

const getDirectReports = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const directReports = await ldapRepository.getDirectReports(
    ldapConfig.ldapUrl,
    ldapConfig.bindDN,
    ldapConfig.bindPassword,
    ldapConfig.searchBase,
    payload.userName,
    { reuse: true }
  );

  return {
    success: true,
    directReports,
    count: directReports.length
  };
};

const getManagerChain = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const managerChain = await ldapRepository.getManagerChain(
    ldapConfig.ldapUrl,
    ldapConfig.bindDN,
    ldapConfig.bindPassword,
    ldapConfig.searchBase,
    payload.userName,
    undefined,
    { reuse: true }
  );

  return {
    success: true,
    managerChain,
    levels: managerChain.length
  };
};

const searchByDepartment = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const users = await ldapRepository.searchByDepartment(
    ldapConfig.ldapUrl,
    ldapConfig.bindDN,
    ldapConfig.bindPassword,
    ldapConfig.searchBase,
    payload.department,
    undefined,
    { reuse: true }
  );

  return {
    success: true,
    users,
    count: users.length,
    department: payload.department
  };
};

const getAllDepartments = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const departments = await ldapRepository.getAllDepartments(
    ldapConfig.ldapUrl,
    ldapConfig.bindDN,
    ldapConfig.bindPassword,
    ldapConfig.searchBase,
    { reuse: true }
  );

  return {
    success: true,
    departments,
    count: departments.length
  };
};

const getAllLocations = async (payload) => {
  const ldapConfig = resolveLdapConfig(payload);
  const locations = await ldapRepository.getAllLocations(
    ldapConfig.ldapUrl,
    ldapConfig.bindDN,
    ldapConfig.bindPassword,
    ldapConfig.searchBase,
    { reuse: true }
  );

  return {
    success: true,
    locations,
    count: locations.length
  };
};

module.exports = {
  searchDirectory,
  getUserDetails,
  getGroupMembers,
  getDirectReports,
  getManagerChain,
  searchByDepartment,
  getAllDepartments,
  getAllLocations
};

