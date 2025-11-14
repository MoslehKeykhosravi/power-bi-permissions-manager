const ldap = require('ldapjs');
const logger = require('../utils/logger');

/**
 * Enhanced Active Directory Helper Functions
 * Provides deep AD integration with group management and organizational hierarchy
 */

/**
 * Create and bind LDAP client
 */
const clientPool = new Map();
const POOL_TTL_MS = 2 * 60 * 1000;

const buildPoolKey = (ldapUrl, bindDN) => `${ldapUrl}|${bindDN}`;

const safeUnbind = (client) => {
  if (!client) return;
  try {
    client.unbind();
  } catch (err) {
    logger.warn('Failed to unbind LDAP client gracefully', err);
  }
};

async function createLdapClient(ldapUrl, bindDN, bindPassword, { reuse = true } = {}) {
  const poolKey = buildPoolKey(ldapUrl, bindDN);

  if (reuse) {
    const pooled = clientPool.get(poolKey);
    if (pooled) {
      if (Date.now() < pooled.expiresAt && pooled.client?.connected) {
        return pooled.client;
      }
      safeUnbind(pooled.client);
      clientPool.delete(poolKey);
    }
  }

  const client = ldap.createClient({
    url: ldapUrl,
    timeout: 5000,
    connectTimeout: 10000,
    reconnect: true
  });

  const boundClient = await new Promise((resolve, reject) => {
    client.bind(bindDN, bindPassword, (err) => {
      if (err) {
        client.unbind();
        reject(err);
      } else {
        resolve(client);
      }
    });
  });

  if (reuse) {
    const expiresAt = Date.now() + POOL_TTL_MS;
    clientPool.set(poolKey, {
      client: boundClient,
      expiresAt
    });

    setTimeout(() => {
      const entry = clientPool.get(poolKey);
      if (entry && entry.client === boundClient && Date.now() >= entry.expiresAt) {
        clientPool.delete(poolKey);
        safeUnbind(boundClient);
      }
    }, POOL_TTL_MS);
  }

  return boundClient;
}

const releaseClient = (ldapUrl, bindDN) => {
  const poolKey = buildPoolKey(ldapUrl, bindDN);
  const entry = clientPool.get(poolKey);
  if (entry) {
    clientPool.delete(poolKey);
    safeUnbind(entry.client);
  }
};

/**
 * Search LDAP with given options
 */
async function ldapSearch(client, searchBase, searchOptions) {
  return new Promise((resolve, reject) => {
    const results = [];

    client.search(searchBase, searchOptions, (err, searchRes) => {
      if (err) {
        reject(err);
        return;
      }

      searchRes.on('searchEntry', (entry) => {
        results.push(entry);
      });

      searchRes.on('error', (err) => {
        reject(err);
      });

      searchRes.on('end', () => {
        resolve(results);
      });
    });
  });
}

/**
 * Get attribute value from LDAP entry
 */
function getAttribute(entry, attrName) {
  const obj = entry.object || {};
  const attrs = entry.attributes || [];
  
  // Try from object first
  if (obj[attrName]) {
    return obj[attrName];
  }
  
  // Try from attributes array
  const attr = attrs.find(a => a.type && a.type.toLowerCase() === attrName.toLowerCase());
  if (attr && attr.values && attr.values.length > 0) {
    return attr.values[0];
  }
  
  return null;
}

/**
 * Get all attribute values (for multi-valued attributes like memberOf)
 */
function getAttributeValues(entry, attrName) {
  const attrs = entry.attributes || [];
  const attr = attrs.find(a => a.type && a.type.toLowerCase() === attrName.toLowerCase());
  
  if (attr && attr.values) {
    return attr.values;
  }
  
  return [];
}

/**
 * Parse Distinguished Name to extract CN
 */
function parseDN(dn) {
  if (!dn) return null;
  const match = dn.match(/CN=([^,]+)/i);
  return match ? match[1] : dn;
}

/**
 * Get detailed user information including organizational data
 */
async function getUserDetails(ldapUrl, bindDN, bindPassword, searchBase, userName, options = {}) {
  let client;
  
  try {
    client = await createLdapClient(ldapUrl, bindDN, bindPassword, options);
    
    // Search for the specific user with comprehensive attributes
    const searchOptions = {
      filter: `(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=${userName})(cn=${userName})(userPrincipalName=${userName})))`,
      scope: 'sub',
      attributes: [
        'sAMAccountName',
        'cn',
        'displayName',
        'givenName',
        'sn',
        'mail',
        'userPrincipalName',
        'telephoneNumber',
        'mobile',
        'title',
        'department',
        'company',
        'manager',
        'directReports',
        'memberOf',
        'physicalDeliveryOfficeName',
        'l', // city/location
        'st', // state
        'co', // country
        'distinguishedName',
        'whenCreated',
        'whenChanged',
        'accountExpires',
        'userAccountControl'
      ],
      sizeLimit: 1
    };

    const results = await ldapSearch(client, searchBase, searchOptions);
    
    if (results.length === 0) {
      return null;
    }

    const entry = results[0];
    
    // Extract all attributes
    const userDetails = {
      sAMAccountName: getAttribute(entry, 'sAMAccountName'),
      cn: getAttribute(entry, 'cn'),
      displayName: getAttribute(entry, 'displayName'),
      givenName: getAttribute(entry, 'givenName'),
      surname: getAttribute(entry, 'sn'),
      email: getAttribute(entry, 'mail'),
      userPrincipalName: getAttribute(entry, 'userPrincipalName'),
      telephoneNumber: getAttribute(entry, 'telephoneNumber'),
      mobile: getAttribute(entry, 'mobile'),
      title: getAttribute(entry, 'title'),
      department: getAttribute(entry, 'department'),
      company: getAttribute(entry, 'company'),
      managerDN: getAttribute(entry, 'manager'),
      office: getAttribute(entry, 'physicalDeliveryOfficeName'),
      city: getAttribute(entry, 'l'),
      state: getAttribute(entry, 'st'),
      country: getAttribute(entry, 'co'),
      distinguishedName: getAttribute(entry, 'distinguishedName'),
      whenCreated: getAttribute(entry, 'whenCreated'),
      whenChanged: getAttribute(entry, 'whenChanged'),
      directReportsDN: getAttributeValues(entry, 'directReports'),
      memberOf: getAttributeValues(entry, 'memberOf'),
      userAccountControl: getAttribute(entry, 'userAccountControl')
    };

    // Parse manager name
    if (userDetails.managerDN) {
      userDetails.managerName = parseDN(userDetails.managerDN);
    }

    // Parse group names from memberOf
    userDetails.groups = userDetails.memberOf.map(dn => parseDN(dn));

    // Check if account is active
    const uac = parseInt(userDetails.userAccountControl || '0');
    userDetails.isActive = !(uac & 0x0002); // Check ACCOUNTDISABLE flag

    return userDetails;
  } catch (error) {
    logger.error('Error getting user details:', error);
    if (options?.reuse) {
      releaseClient(ldapUrl, bindDN);
    }
    throw error;
  } finally {
    if (client && (!options || options.reuse !== true)) {
      safeUnbind(client);
    }
  }
}

/**
 * Get group members
 */
async function getGroupMembers(ldapUrl, bindDN, bindPassword, searchBase, groupName, options = {}) {
  let client;
  
  try {
    client = await createLdapClient(ldapUrl, bindDN, bindPassword, options);
    
    // First, find the group
    const groupSearchOptions = {
      filter: `(&(objectCategory=group)(|(cn=${groupName})(sAMAccountName=${groupName})))`,
      scope: 'sub',
      attributes: ['distinguishedName', 'member', 'cn', 'description'],
      sizeLimit: 1
    };

    const groupResults = await ldapSearch(client, searchBase, groupSearchOptions);
    
    if (groupResults.length === 0) {
      return { group: null, members: [] };
    }

    const groupEntry = groupResults[0];
    const memberDNs = getAttributeValues(groupEntry, 'member');
    
    const groupInfo = {
      cn: getAttribute(groupEntry, 'cn'),
      description: getAttribute(groupEntry, 'description'),
      distinguishedName: getAttribute(groupEntry, 'distinguishedName'),
      memberCount: memberDNs.length
    };

    // Now get details for each member
    const members = [];
    
    for (const memberDN of memberDNs) {
      try {
        const memberSearchOptions = {
          filter: '(objectClass=*)',
          scope: 'base',
          attributes: [
            'sAMAccountName',
            'cn',
            'displayName',
            'mail',
            'objectClass',
            'department',
            'title'
          ]
        };

        const memberResults = await ldapSearch(client, memberDN, memberSearchOptions);
        
        if (memberResults.length > 0) {
          const memberEntry = memberResults[0];
          const objectClasses = getAttributeValues(memberEntry, 'objectClass');
          const isGroup = objectClasses.includes('group');
          
          members.push({
            sAMAccountName: getAttribute(memberEntry, 'sAMAccountName'),
            cn: getAttribute(memberEntry, 'cn'),
            displayName: getAttribute(memberEntry, 'displayName'),
            email: getAttribute(memberEntry, 'mail'),
            department: getAttribute(memberEntry, 'department'),
            title: getAttribute(memberEntry, 'title'),
            distinguishedName: memberDN,
            type: isGroup ? 'group' : 'user'
          });
        }
      } catch (err) {
        logger.warn(`Could not get details for member: ${memberDN}`, err);
        // Add minimal info
        members.push({
          cn: parseDN(memberDN),
          distinguishedName: memberDN,
          type: 'unknown'
        });
      }
    }

    return { group: groupInfo, members };
  } catch (error) {
    logger.error('Error getting group members:', error);
    if (options?.reuse) {
      releaseClient(ldapUrl, bindDN);
    }
    throw error;
  } finally {
    if (client && (!options || options.reuse !== true)) {
      safeUnbind(client);
    }
  }
}

/**
 * Get user's direct reports (subordinates)
 */
async function getDirectReports(ldapUrl, bindDN, bindPassword, searchBase, userName, options = {}) {
  let client;
  
  try {
    client = await createLdapClient(ldapUrl, bindDN, bindPassword, options);
    
    // First get the user's DN
    const userSearchOptions = {
      filter: `(&(objectCategory=person)(objectClass=user)(sAMAccountName=${userName}))`,
      scope: 'sub',
      attributes: ['distinguishedName', 'directReports'],
      sizeLimit: 1
    };

    const userResults = await ldapSearch(client, searchBase, userSearchOptions);
    
    if (userResults.length === 0) {
      return [];
    }

    const userEntry = userResults[0];
    const directReportDNs = getAttributeValues(userEntry, 'directReports');
    
    const directReports = [];
    
    for (const reportDN of directReportDNs) {
      try {
        const reportSearchOptions = {
          filter: '(objectClass=*)',
          scope: 'base',
          attributes: [
            'sAMAccountName',
            'cn',
            'displayName',
            'mail',
            'title',
            'department',
            'telephoneNumber'
          ]
        };

        const reportResults = await ldapSearch(client, reportDN, reportSearchOptions);
        
        if (reportResults.length > 0) {
          const reportEntry = reportResults[0];
          
          directReports.push({
            sAMAccountName: getAttribute(reportEntry, 'sAMAccountName'),
            cn: getAttribute(reportEntry, 'cn'),
            displayName: getAttribute(reportEntry, 'displayName'),
            email: getAttribute(reportEntry, 'mail'),
            title: getAttribute(reportEntry, 'title'),
            department: getAttribute(reportEntry, 'department'),
            telephoneNumber: getAttribute(reportEntry, 'telephoneNumber'),
            distinguishedName: reportDN
          });
        }
      } catch (err) {
        logger.warn(`Could not get details for direct report: ${reportDN}`, err);
      }
    }

    return directReports;
  } catch (error) {
    logger.error('Error getting direct reports:', error);
    if (options?.reuse) {
      releaseClient(ldapUrl, bindDN);
    }
    throw error;
  } finally {
    if (client && (!options || options.reuse !== true)) {
      safeUnbind(client);
    }
  }
}

/**
 * Get organizational hierarchy (manager chain)
 */
async function getManagerChain(ldapUrl, bindDN, bindPassword, searchBase, userName, maxLevels = 10, options = {}) {
  let client;
  
  try {
    client = await createLdapClient(ldapUrl, bindDN, bindPassword, options);
    
    const chain = [];
    const visitedUsers = new Set(); // Track visited users to prevent circular references
    let currentUserName = userName;
    let level = 0;
    
    while (currentUserName && level < maxLevels) {
      // Check for circular reference
      const userNameLower = currentUserName.toLowerCase();
      if (visitedUsers.has(userNameLower)) {
        logger.warn(`Circular manager reference detected at ${currentUserName}. Stopping chain.`);
        break;
      }
      
      visitedUsers.add(userNameLower);
      
      const searchOptions = {
        filter: `(&(objectCategory=person)(objectClass=user)(sAMAccountName=${currentUserName}))`,
        scope: 'sub',
        attributes: [
          'sAMAccountName',
          'cn',
          'displayName',
          'title',
          'department',
          'mail',
          'manager'
        ],
        sizeLimit: 1
      };

      const results = await ldapSearch(client, searchBase, searchOptions);
      
      if (results.length === 0) {
        break;
      }

      const entry = results[0];
      const managerDN = getAttribute(entry, 'manager');
      
      chain.push({
        sAMAccountName: getAttribute(entry, 'sAMAccountName'),
        cn: getAttribute(entry, 'cn'),
        displayName: getAttribute(entry, 'displayName'),
        title: getAttribute(entry, 'title'),
        department: getAttribute(entry, 'department'),
        email: getAttribute(entry, 'mail'),
        level: level,
        isTopLevel: !managerDN
      });

      if (!managerDN) {
        break;
      }

      // Get manager's sAMAccountName for next iteration
      try {
        const managerSearchOptions = {
          filter: '(objectClass=*)',
          scope: 'base',
          attributes: ['sAMAccountName']
        };

        const managerResults = await ldapSearch(client, managerDN, managerSearchOptions);
        
        if (managerResults.length > 0) {
          const nextUserName = getAttribute(managerResults[0], 'sAMAccountName');
          
          // Check if next manager is already in the chain (circular reference)
          if (visitedUsers.has(nextUserName.toLowerCase())) {
            logger.warn(`Circular manager reference detected: ${nextUserName} is already in chain. Stopping.`);
            // Mark current user as top level since we can't go further
            chain[chain.length - 1].isTopLevel = true;
            break;
          }
          
          currentUserName = nextUserName;
          level++;
        } else {
          break;
        }
      } catch (err) {
        break;
      }
    }

    return chain;
  } catch (error) {
    logger.error('Error getting manager chain:', error);
    if (options?.reuse) {
      releaseClient(ldapUrl, bindDN);
    }
    throw error;
  } finally {
    if (client && (!options || options.reuse !== true)) {
      safeUnbind(client);
    }
  }
}

/**
 * Search users by department
 */
async function searchByDepartment(ldapUrl, bindDN, bindPassword, searchBase, department, maxResults = 500, options = {}) {
  let client;
  
  try {
    client = await createLdapClient(ldapUrl, bindDN, bindPassword, options);
    
    const searchOptions = {
      filter: `(&(objectCategory=person)(objectClass=user)(department=${department}))`,
      scope: 'sub',
      attributes: [
        'sAMAccountName',
        'displayName',
        'mail',
        'title',
        'department',
        'telephoneNumber'
      ],
      sizeLimit: maxResults
    };

    const results = await ldapSearch(client, searchBase, searchOptions);
    
    return results.map(entry => ({
      sAMAccountName: getAttribute(entry, 'sAMAccountName'),
      displayName: getAttribute(entry, 'displayName'),
      email: getAttribute(entry, 'mail'),
      title: getAttribute(entry, 'title'),
      department: getAttribute(entry, 'department'),
      telephoneNumber: getAttribute(entry, 'telephoneNumber'),
      type: 'user'
    }));
  } catch (error) {
    logger.error('Error searching by department:', error);
    if (options?.reuse) {
      releaseClient(ldapUrl, bindDN);
    }
    throw error;
  } finally {
    if (client && (!options || options.reuse !== true)) {
      safeUnbind(client);
    }
  }
}

/**
 * Get all unique departments
 */
async function getAllDepartments(ldapUrl, bindDN, bindPassword, searchBase, options = {}) {
  let client;
  
  try {
    client = await createLdapClient(ldapUrl, bindDN, bindPassword, options);
    
    const searchOptions = {
      filter: '(&(objectCategory=person)(objectClass=user)(department=*))',
      scope: 'sub',
      attributes: ['department'],
      sizeLimit: 10000
    };

    const results = await ldapSearch(client, searchBase, searchOptions);
    
    const departments = new Set();
    results.forEach(entry => {
      const dept = getAttribute(entry, 'department');
      if (dept) {
        departments.add(dept);
      }
    });

    return Array.from(departments).sort();
  } catch (error) {
    logger.error('Error getting departments:', error);
    if (options?.reuse) {
      releaseClient(ldapUrl, bindDN);
    }
    throw error;
  } finally {
    if (client && (!options || options.reuse !== true)) {
      safeUnbind(client);
    }
  }
}

/**
 * Get all unique locations/offices
 */
async function getAllLocations(ldapUrl, bindDN, bindPassword, searchBase, options = {}) {
  let client;
  
  try {
    client = await createLdapClient(ldapUrl, bindDN, bindPassword, options);
    
    const searchOptions = {
      filter: '(&(objectCategory=person)(objectClass=user))',
      scope: 'sub',
      attributes: ['l', 'physicalDeliveryOfficeName'],
      sizeLimit: 10000
    };

    const results = await ldapSearch(client, searchBase, searchOptions);
    
    const locations = new Set();
    results.forEach(entry => {
      const city = getAttribute(entry, 'l');
      const office = getAttribute(entry, 'physicalDeliveryOfficeName');
      
      if (city) locations.add(city);
      if (office) locations.add(office);
    });

    return Array.from(locations).sort();
  } catch (error) {
    logger.error('Error getting locations:', error);
    if (options?.reuse) {
      releaseClient(ldapUrl, bindDN);
    }
    throw error;
  } finally {
    if (client && (!options || options.reuse !== true)) {
      safeUnbind(client);
    }
  }
}

module.exports = {
  createLdapClient,
  ldapSearch,
  getAttribute,
  getAttributeValues,
  parseDN,
  getUserDetails,
  getGroupMembers,
  getDirectReports,
  getManagerChain,
  searchByDepartment,
  getAllDepartments,
  getAllLocations,
  releaseClient
};

