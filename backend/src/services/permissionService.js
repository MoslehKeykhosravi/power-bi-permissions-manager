const powerBiRepository = require('../repositories/powerBiRepository');
const logger = require('../utils/logger');
const AppError = require('../errors/AppError');
const config = require('../config');
const { ROLE_DEFINITIONS } = require('../constants/roles');

const CACHE_TTL_MS = 60 * 1000;

const createTimedCache = () => {
  const store = new Map();

  const get = (key) => {
    const entry = store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  };

  const set = (key, value) => {
    store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  };

  return { get, set };
};

const catalogCache = createTimedCache();
const policyCache = createTimedCache();

const getCatalogSnapshot = async (serverUri) => {
  const cacheKey = serverUri;
  const cached = catalogCache.get(cacheKey);
  if (cached) {
    logger.debug(`[Permissions] Using cached catalog for ${serverUri}`);
    return cached;
  }

  const catalogResponse = await powerBiRepository.getCatalogItems(serverUri);
  catalogCache.set(cacheKey, catalogResponse);
  return catalogResponse;
};

const buildPolicyCacheKey = (serverUri, item) => {
  const idPart = item?.Id ? `id:${item.Id}` : '';
  const pathPart = item?.Path ? `path:${item.Path}` : '';
  const typePart = item?.Type ? `type:${item.Type}` : '';
  return `${serverUri}|${typePart}|${idPart}|${pathPart}`;
};

const getCachedPolicies = (serverUri, item, fetcher) => {
  const cacheKey = buildPolicyCacheKey(serverUri, item);
  const cached = policyCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const resultPromise = fetcher();
  policyCache.set(cacheKey, resultPromise);
  return resultPromise;
};

const formatUserName = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('\\')) {
    return trimmed;
  }

  if (trimmed.includes('@')) {
    const [userPart] = trimmed.split('@');
    const domain = config.powerBi?.domain;
    return domain ? `${domain}\\${userPart}` : userPart;
  }

  const domain = config.powerBi?.domain;
  if (domain) {
    return `${domain}\\${trimmed}`;
  }

  return trimmed;
};

const trySequentially = async (handlers) => {
  let lastError = null;
  for (const handler of handlers) {
    try {
      const value = await handler();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) {
    throw lastError;
  }
  return null;
};

const getPolicies = async (serverUri, { itemId, itemPath }) => {
  const handlers = [];

  if (itemId) {
    handlers.push(
      () => powerBiRepository.getPowerBiPoliciesById(serverUri, itemId),
      () => powerBiRepository.getCatalogPoliciesById(serverUri, itemId)
    );
  }

  if (itemPath) {
    handlers.push(
      () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, true),
      () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, false)
    );
  }

  if (!handlers.length) {
    return null;
  }

  try {
    return await trySequentially(handlers);
  } catch (error) {
    logger.warn(`Failed to retrieve policies for ${itemId || itemPath}: ${error.message}`);
    return null;
  }
};

const mapPoliciesToUsers = (policies) => {
  if (!policies?.Policies) {
    return [];
  }

  const users = [];
  policies.Policies.forEach(policy => {
    if (policy.GroupUserName) {
      users.push({
        userName: policy.GroupUserName,
        roles: policy.Roles
      });
    }
  });

  return users;
};

const getPermissions = async ({ serverUri, itemId, itemPath }) => {
  const policies = await getPolicies(serverUri, { itemId, itemPath });
  return {
    success: true,
    users: mapPoliciesToUsers(policies)
  };
};

const normalizeUserName = (value) => {
  if (!value) return '';
  const lowered = value.toLowerCase();
  return lowered.includes('\\') ? lowered.split('\\').pop() : lowered;
};

const fetchRootPolicies = async (serverUri) => {
  const cacheKey = `${serverUri}|rootPolicies`;
  const cached = policyCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const handlers = [
    () => powerBiRepository.getCatalogPoliciesByPath(serverUri, '/', true),
    () => powerBiRepository.getCatalogPoliciesByPath(serverUri, '/', false)
  ];

  try {
    const result = await trySequentially(handlers);
    if (result) {
      policyCache.set(cacheKey, result);
    }
    return result;
  } catch (error) {
    logger.warn(`Failed to fetch root path policies: ${error.message}`);
    return null;
  }
};

const extractFolderPath = (item, itemPath) => {
  if (item.Type === 'Folder') {
    return itemPath;
  }

  const trimmedPath = (itemPath || '').replace(/\/$/, '');
  const nameSegment = `/${item.Name}`;
  if (trimmedPath.endsWith(nameSegment)) {
    const withoutName = trimmedPath.slice(0, -nameSegment.length);
    return withoutName || '/';
  }

  if (itemPath === `/${item.Name}`) {
    return '/';
  }

  return itemPath;
};

const matchUserPolicy = (policyUserName, userName) => {
  const policyLower = (policyUserName || '').toLowerCase();
  const targetLower = (userName || '').toLowerCase();
  const policyUserOnly = normalizeUserName(policyLower);
  const targetUserOnly = normalizeUserName(targetLower);

  return policyLower === targetLower ||
    policyLower.endsWith(`\\${targetLower}`) ||
    policyUserOnly === targetUserOnly ||
    policyLower === targetUserOnly ||
    targetUserOnly === policyUserOnly;
};

const collectRoles = (policy) => {
  const roles = [];
  if (policy.Roles && Array.isArray(policy.Roles)) {
    policy.Roles.forEach(role => {
      const roleName = role?.Name || role;
      if (roleName && !roles.includes(roleName)) {
        roles.push(roleName);
      }
    });
  }
  return roles;
};

const fetchPoliciesForItem = async (serverUri, item) => {
  const handlers = [];

  if (item.Id && (item.Type === 'PowerBIReport' || item.Type === 'Report')) {
    handlers.push(() => powerBiRepository.getPowerBiPoliciesById(serverUri, item.Id));
  }

  handlers.push(
    () => powerBiRepository.getCatalogPoliciesByPath(serverUri, item.Path, true),
    () => powerBiRepository.getCatalogPoliciesByPath(serverUri, item.Path, false)
  );

  try {
    return await trySequentially(handlers);
  } catch (error) {
    return null;
  }
};

const fetchPoliciesWithCache = (serverUri, item) =>
  getCachedPolicies(serverUri, item, () => fetchPoliciesForItem(serverUri, item));

const checkSingleUserPermissions = async (serverUri, catalogItems, userName) => {
  const userPermissions = [];
  const userNameLower = userName.toLowerCase();

  // Root path check
  const rootPolicies = await fetchRootPolicies(serverUri);
  if (rootPolicies?.Policies) {
    const rootPolicy = rootPolicies.Policies.find(policy =>
      matchUserPolicy(policy.GroupUserName, userNameLower)
    );
    if (rootPolicy) {
      const roles = collectRoles(rootPolicy);
      if (roles.length) {
        userPermissions.push({
          itemType: 'Folder',
          path: '/',
          name: '/',
          roles,
          folderPath: '/',
          id: null,
          catalogType: 'Folder'
        });
      }
    }
  }

  const validItems = catalogItems.filter(item => item.Path);
  const BATCH_SIZE = 20;

  for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
    const batch = validItems.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async (item) => {
      const policies = await fetchPoliciesWithCache(serverUri, item);
      if (!policies?.Policies || !policies.Policies.length) {
        return null;
      }

      const matchedRoles = [];
      policies.Policies.forEach(policy => {
        if (matchUserPolicy(policy.GroupUserName, userNameLower)) {
          const roles = collectRoles(policy);
          roles.forEach(role => {
            if (!matchedRoles.includes(role)) {
              matchedRoles.push(role);
            }
          });
        }
      });

      if (!matchedRoles.length) {
        return null;
      }

      return {
        path: item.Path,
        folderPath: extractFolderPath(item, item.Path),
        name: item.Name || item.Path.split('/').pop(),
        itemType: item.Type === 'Folder' ? 'Folder' : 'Report',
        type: item.Type,
        roles: matchedRoles,
        id: item.Id || null,
        catalogType: item.Type
      };
    }));

    batchResults.forEach(result => {
      if (result) {
        userPermissions.push(result);
      }
    });
  }

  return userPermissions;
};

const normalizePath = (path) => {
  if (!path) return '';
  try {
    return decodeURIComponent(path).replace(/\\/g, '/').replace(/\/+/g, '/').trim();
  } catch (error) {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
  }
};

const findMatchingPermission = (target, permissions) => {
  return permissions.find(perm => {
    if (target.id && perm.id && target.id === perm.id) {
      return true;
    }

    if (target.path && perm.path && normalizePath(target.path) === normalizePath(perm.path)) {
      return true;
    }

    if (target.itemType === perm.itemType &&
        target.name === perm.name &&
        target.folderPath &&
        perm.folderPath &&
        normalizePath(target.folderPath) === normalizePath(perm.folderPath)) {
      return true;
    }

    if (target.name === perm.name &&
        target.itemType === perm.itemType &&
        (!target.folderPath || target.folderPath === '/') &&
        (!perm.folderPath || perm.folderPath === '/')) {
      return true;
    }

    return false;
  }) || null;
};

const intersectRoles = (roleSets) => {
  let intersection = null;
  roleSets.forEach(roleSet => {
    const current = new Set(roleSet);
    if (intersection === null) {
      intersection = current;
    } else {
      intersection = new Set([...intersection].filter(role => current.has(role)));
    }
  });
  return intersection ? Array.from(intersection) : [];
};

const checkPermissions = async ({ serverUri, users }) => {
  const catalogData = await getCatalogSnapshot(serverUri);
  const catalogItems = catalogData.value || [];
  logger.info(`✓ Retrieved ${catalogItems.length} catalog items`);

  const allUsersPermissions = [];
  for (const userName of users) {
    const permissions = await checkSingleUserPermissions(serverUri, catalogItems, userName);
    logger.info(`User "${userName}" has access to ${permissions.length} items.`);
    allUsersPermissions.push({ userName, permissions });
  }

  let finalPermissions = [];
  if (allUsersPermissions.length === 1) {
    finalPermissions = allUsersPermissions[0].permissions;
  } else {
    const mutualItems = allUsersPermissions[0].permissions.map(perm => ({
      ...perm,
      userRoles: [new Set(perm.roles)]
    }));

    for (let i = 1; i < allUsersPermissions.length; i++) {
      const current = allUsersPermissions[i].permissions;
      const remaining = [];

      mutualItems.forEach(item => {
        const match = findMatchingPermission(item, current);
        if (match) {
          item.userRoles.push(new Set(match.roles));
          remaining.push(item);
        }
      });

      mutualItems.length = 0;
      mutualItems.push(...remaining);
    }

    finalPermissions = mutualItems.map(item => {
      const roles = intersectRoles(item.userRoles);
      const { userRoles, ...rest } = item;
      return { ...rest, roles };
    }).filter(perm => perm.roles.length > 0);
  }

  return {
    success: true,
    permissions: finalPermissions,
    userName: users.length === 1 ? users[0] : null,
    userNames: users.length > 1 ? users : null,
    totalChecked: catalogItems.length,
    isMutual: users.length > 1
  };
};

const extractUsername = (value) => {
  if (!value) return '';
  const [withoutDomain] = value.split('\\').slice(-1);
  const [beforeAt] = withoutDomain.split('@');
  return beforeAt || withoutDomain;
};

const buildExistingPolicies = (existingPolicies, userName, roles) => {
  const policies = [];
  const inputUserNameNormalized = extractUsername(userName).toLowerCase().trim();
  let userExists = false;

  existingPolicies?.Policies?.forEach(policy => {
    const policyUserNameNormalized = extractUsername(policy.GroupUserName).toLowerCase().trim();
    const isMatch = policyUserNameNormalized === inputUserNameNormalized;

    if (isMatch) {
      userExists = true;
      if (roles.length === 0) {
        logger.info(`Removing user ${policy.GroupUserName} from policies`);
        return;
      }

      const mappedRoles = roles
        .map(roleName => ROLE_DEFINITIONS[roleName])
        .filter(Boolean);

      if (mappedRoles.length) {
        policies.push({
          GroupUserName: policy.GroupUserName,
          Roles: mappedRoles
        });
      }
    } else {
      policies.push({
        GroupUserName: policy.GroupUserName,
        Roles: policy.Roles
      });
    }
  });

  return { policies, userExists };
};

const getPolicyFetchers = ({ serverUri, itemId, itemPath, itemType }) => {
  const getHandlers = [];
  const setHandlers = [];

  if (itemType === 'Folder' && itemPath) {
    getHandlers.push(
      () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, true),
      () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, false)
    );
    setHandlers.push(
      (body) => powerBiRepository.setPoliciesByPath(serverUri, itemPath, body, true),
      (body) => powerBiRepository.setPoliciesByPath(serverUri, itemPath, body, false)
    );
  } else if (itemId) {
    getHandlers.push(
      () => powerBiRepository.getPowerBiPoliciesById(serverUri, itemId),
      () => powerBiRepository.getCatalogPoliciesById(serverUri, itemId)
    );
    setHandlers.push(
      (body) => powerBiRepository.setPoliciesByPowerBiId(serverUri, itemId, body),
      (body) => powerBiRepository.setPoliciesByCatalogId(serverUri, itemId, body)
    );

    if (itemPath) {
      getHandlers.push(
        () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, true),
        () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, false)
      );
      setHandlers.push(
        (body) => powerBiRepository.setPoliciesByPath(serverUri, itemPath, body, true),
        (body) => powerBiRepository.setPoliciesByPath(serverUri, itemPath, body, false)
      );
    }
  } else if (itemPath) {
    getHandlers.push(
      () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, true),
      () => powerBiRepository.getCatalogPoliciesByPath(serverUri, itemPath, false)
    );
    setHandlers.push(
      (body) => powerBiRepository.setPoliciesByPath(serverUri, itemPath, body, true),
      (body) => powerBiRepository.setPoliciesByPath(serverUri, itemPath, body, false)
    );
  }

  return { getHandlers, setHandlers };
};

const setPermissions = async ({ serverUri, itemId, itemPath, userName, roles, itemType }) => {
  const { getHandlers, setHandlers } = getPolicyFetchers({ serverUri, itemId, itemPath, itemType });
  logger.info(`[Set Permissions] Attempting to update policies for ${userName}`);

  let existingPolicies = null;
  for (const handler of getHandlers) {
    try {
      existingPolicies = await handler();
      break;
    } catch (error) {
      continue;
    }
  }

  if (!existingPolicies) {
    logger.warn('[Set Permissions] Existing policies not found. Proceeding with new payload.');
  }

  const { policies, userExists } = buildExistingPolicies(existingPolicies, userName, roles);
  const isRemovalRequest = roles.length === 0;

  if (!userExists && !isRemovalRequest) {
    const mappedRoles = roles.map(roleName => ROLE_DEFINITIONS[roleName]).filter(Boolean);
    if (mappedRoles.length) {
      const formattedUserName = formatUserName(userName);
      if (!formattedUserName) {
        throw new AppError(400, 'Invalid userName for policies');
      }
      policies.push({
        GroupUserName: formattedUserName,
        Roles: mappedRoles
      });
    }
  }

  const requestBody = { Policies: policies };
  let success = false;
  let lastError = null;

  for (const setter of setHandlers) {
    try {
      await setter(requestBody);
      success = true;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!success) {
    throw new AppError(500, 'Failed to set permissions', lastError?.message);
  }

  return {
    success: true,
    message: 'Permissions set successfully'
  };
};

module.exports = {
  getPermissions,
  checkPermissions,
  setPermissions
};

