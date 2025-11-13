const express = require('express');
const router = express.Router();
const httpntlm = require('httpntlm');

/**
 * Helper function to make NTLM GET request
 */
function ntlmGet(url, domain, user, password) {
  return new Promise((resolve, reject) => {
    console.log(`  NTLM GET - URL: ${url}`);
    console.log(`  NTLM Auth - Domain: "${domain}", User: "${user}"`);
    
    httpntlm.get({
      url: url,
      username: user,
      password: password,
      workstation: '',
      domain: domain,
      headers: {
        'Accept': 'application/json; charset=utf-8'
      }
    }, (err, response) => {
      if (err) {
        console.error(`  NTLM GET Error: ${err.message}`);
        reject(err);
      } else {
        if (response.statusCode === 200) {
          try {
            const data = JSON.parse(response.body);
            resolve(data);
          } catch (parseErr) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      }
    });
  });
}

/**
 * Helper function to make NTLM PUT request
 */
function ntlmPut(url, domain, user, password, body) {
  return new Promise((resolve, reject) => {
    httpntlm.put({
      url: url,
      username: user,
      password: password,
      workstation: '',
      domain: domain,
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }, (err, response) => {
      if (err) {
        console.error(`  NTLM PUT Error: ${err.message}`);
        reject(err);
      } else {
        if (response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 204) {
          resolve({ statusCode: response.statusCode, body: response.body });
        } else {
          console.error(`  Response body: ${response.body ? response.body.substring(0, 500) : 'empty'}`);
          reject(new Error(`HTTP ${response.statusCode}: ${response.body || 'Failed to set permissions'}`));
        }
      }
    });
  });
}

/**
 * POST /api/permissions/get
 * Get permissions/policies for a specific item
 */
router.post('/get', async (req, res) => {
  try {
    const { serverUri, itemId, itemPath } = req.body;

    if (!serverUri || (!itemId && !itemPath)) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Get credentials from environment variables (SECURE!)
    const domain = process.env.PBI_DOMAIN;
    const user = process.env.PBI_USER;
    const password = process.env.PBI_PASSWORD;

    if (!domain || !user || !password) {
      return res.status(500).json({ 
        error: 'Server configuration error: PBI credentials not configured properly' 
      });
    }

    const endpoints = [];
    
    if (itemId) {
      endpoints.push(
        `${serverUri}/api/v2.0/PowerBIReports(${itemId})/Policies`,
        `${serverUri}/api/v2.0/CatalogItems(${itemId})/Policies`
      );
    }
    
    if (itemPath) {
      const escapedPath = itemPath.replace(/'/g, "''");
      endpoints.push(
        `${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`
      );
    }

    let policies = null;
    for (const endpoint of endpoints) {
      try {
        policies = await ntlmGet(endpoint, domain, user, password);
        console.log(`✓ Retrieved policies from: ${endpoint}`);
        break;
      } catch (error) {
        continue;
      }
    }

    if (policies) {
      const users = [];
      if (policies.Policies) {
        policies.Policies.forEach(policy => {
          if (policy.GroupUserName) {
            users.push({
              userName: policy.GroupUserName,
              roles: policy.Roles
            });
          }
        });
      }
      res.json({ success: true, users });
    } else {
      res.json({ success: true, users: [] });
    }

  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch permissions', 
      message: error.message 
    });
  }
});

/**
 * POST /api/permissions/check
 * Check all permissions for specific user(s) across all reports/folders
 * If multiple users provided, returns mutual permissions (items all users have access to)
 */
router.post('/check', async (req, res) => {
  try {
    const { serverUri, userName, userNames } = req.body;

    // Support both single userName and array of userNames
    let usersToCheck = [];
    if (userNames && Array.isArray(userNames) && userNames.length > 0) {
      usersToCheck = userNames;
    } else if (userName) {
      usersToCheck = [userName];
    } else {
      return res.status(400).json({ 
        error: 'Missing required fields: serverUri and userName/userNames' 
      });
    }

    if (!serverUri) {
      return res.status(400).json({ 
        error: 'Missing required field: serverUri' 
      });
    }

    // Log permission check request (for production monitoring)

    // Get credentials from environment variables (SECURE!)
    const domain = process.env.PBI_DOMAIN;
    const user = process.env.PBI_USER;
    const password = process.env.PBI_PASSWORD;

    if (!domain || !user || !password) {
      return res.status(500).json({ 
        error: 'Server configuration error: PBI credentials not configured properly' 
      });
    }

    // First, get all reports/folders from the server
    const catalogEndpoint = `${serverUri}/api/v2.0/CatalogItems`;
    let catalogItems = [];
    
    try {
      const catalogData = await ntlmGet(catalogEndpoint, domain, user, password);
      catalogItems = catalogData.value || [];
      console.log(`✓ Retrieved ${catalogItems.length} catalog items`);
      
    } catch (error) {
      console.error('Failed to get catalog items:', error.message);
      return res.status(500).json({ 
        error: 'Failed to retrieve catalog items', 
        message: error.message 
      });
    }

    // Helper function to check permissions for a single user
    const checkUserPermissions = async (userNameToCheck) => {
      const userPermissions = [];
      const userNameLower = userNameToCheck.toLowerCase();
      
      // Filter out invalid items first
      const validItems = catalogItems.filter(item => {
        const itemPath = item.Path;
        return itemPath && itemPath !== '/';
      });

      // Process items in parallel batches to avoid overwhelming the server
      const BATCH_SIZE = 20; // Process 20 items at a time
      const batches = [];
      
      for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        batches.push(validItems.slice(i, i + BATCH_SIZE));
      }

      // Process each batch in parallel
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Create parallel requests for this batch
        const batchPromises = batch.map(async (item) => {
          const itemPath = item.Path;
          const itemType = item.Type; // 'Folder', 'PowerBIReport', 'Report', etc.
          const itemName = item.Name || '';

          try {
            // For paths with Persian characters, we need to URL-encode the path
            // Try using ID first (most reliable for Persian characters)
            let policyEndpoint = null;
            
            if (item.Id && (itemType === 'PowerBIReport' || itemType === 'Report')) {
              // Use ID-based endpoint for reports (handles Persian characters reliably)
              policyEndpoint = `${serverUri}/api/v2.0/PowerBIReports(${item.Id})/Policies`;
            }
            
            // Fallback to path-based endpoint if ID is not available
            if (!policyEndpoint) {
              const escapedPath = itemPath.replace(/'/g, "''");
              // URL-encode the path parameter for OData queries with Persian characters
              const encodedPath = encodeURIComponent(escapedPath);
              // Use the encoded path in the OData query
              policyEndpoint = `${serverUri}/api/v2.0/CatalogItems(Path='${encodedPath}')/Policies`;
            }
            
            const policies = await ntlmGet(policyEndpoint, domain, user, password);
            
            if (policies && policies.Policies && policies.Policies.length > 0) {
              // Check if user has access and collect roles
              const userRoles = [];
              let matchedPolicy = false;
              
              policies.Policies.forEach(policy => {
                const policyUserName = (policy.GroupUserName || '').toLowerCase();
                
                // Extract username from domain\username format (e.g., "cinnagen\cheraghia" -> "cheraghia")
                const policyUserNameOnly = policyUserName.includes('\\') 
                  ? policyUserName.split('\\').pop() 
                  : policyUserName;
                const userNameOnly = userNameLower.includes('\\')
                  ? userNameLower.split('\\').pop()
                  : userNameLower;
                
                // Exact matching: match by full username or username only (no partial matches)
                // This prevents "cheraghia" from matching "cheraghial"
                const isMatch = policyUserName === userNameLower ||
                                policyUserNameOnly === userNameOnly ||
                                policyUserName === userNameOnly ||
                                userNameOnly === policyUserName;
                
                if (isMatch) {
                  matchedPolicy = true;
                  // Add roles from this policy
                  if (policy.Roles && Array.isArray(policy.Roles)) {
                    policy.Roles.forEach(role => {
                      if (role && role.Name && !userRoles.includes(role.Name)) {
                        userRoles.push(role.Name);
                      }
                    });
                  }
                }
              });

              if (userRoles.length > 0) {
                // For reports, the path might include the report name or might not
                // Extract the actual folder path and report name separately
                let folderPath = itemPath;
                let reportName = item.Name || itemPath.split('/').pop();
                
                // If this is a report (not a folder), try to extract folder path
                if (itemType !== 'Folder' && item.Name) {
                  const pathWithoutTrailingSlash = itemPath.replace(/\/$/, '');
                  const nameWithSlash = `/${item.Name}`;
                  
                  if (pathWithoutTrailingSlash.endsWith(nameWithSlash)) {
                    folderPath = pathWithoutTrailingSlash.substring(0, pathWithoutTrailingSlash.length - nameWithSlash.length) || '/';
                  } else if (pathWithoutTrailingSlash === item.Name) {
                    folderPath = '/';
                  } else if (itemPath === `/${item.Name}`) {
                    folderPath = '/';
                  } else {
                    folderPath = itemPath;
                  }
                } else if (itemType === 'Folder') {
                  folderPath = itemPath;
                }
                
                const resultObject = {
                  path: itemPath,
                  folderPath: folderPath,
                  name: reportName,
                  itemType: itemType === 'Folder' ? 'Folder' : 'Report',
                  type: itemType,
                  roles: userRoles,
                  id: item.Id || null,
                  catalogType: itemType
                };
                return resultObject;
              }
            }
            return null;
          } catch (error) {
            // Silently skip items we can't get policies for
            return null;
          }
        });

        // Wait for all requests in this batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Add non-null results to userPermissions
        batchResults.forEach(result => {
          if (result) {
            userPermissions.push(result);
          }
        });
      }

      return userPermissions;
    };

    // Check permissions for all users
    const allUsersPermissions = [];
    for (const userNameToCheck of usersToCheck) {
      const userPerms = await checkUserPermissions(userNameToCheck);
      console.log(`📋 User "${userNameToCheck}" has access to ${userPerms.length} items:`);
      userPerms.forEach((perm, idx) => {
        console.log(`   ${idx + 1}. ${perm.name} (${perm.itemType}, ID: ${perm.id || 'N/A'}, Path: ${perm.path}): [${perm.roles.join(', ')}]`);
      });
      allUsersPermissions.push({
        userName: userNameToCheck,
        permissions: userPerms
      });
    }

    // If multiple users, find mutual permissions (items all users have access to)
    let finalPermissions = [];
    if (allUsersPermissions.length === 1) {
      // Single user - return all permissions
      finalPermissions = allUsersPermissions[0].permissions;
      console.log(`✓ Found ${finalPermissions.length} items with access for user "${usersToCheck[0]}"`);
    } else {
      // Multiple users - find mutual permissions
      // Helper function to normalize path for matching
      const normalizePath = (p) => {
        if (!p) return '';
        try {
          p = decodeURIComponent(p);
        } catch (e) {
          // If decoding fails, use original
        }
        return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
      };
      
      // Helper function to find matching permission
      const findMatchingPermission = (targetPerm, permissionList) => {
        for (const perm of permissionList) {
          // Strategy 1: Match by ID (most reliable)
          if (targetPerm.id && perm.id && targetPerm.id === perm.id) {
            return perm;
          }
          
          // Strategy 2: Match by path (normalized)
          if (targetPerm.path && perm.path) {
            const normalizedTargetPath = normalizePath(targetPerm.path);
            const normalizedPermPath = normalizePath(perm.path);
            if (normalizedTargetPath === normalizedPermPath) {
              return perm;
            }
          }
          
          // Strategy 3: Match by itemType + folderPath + name
          if (targetPerm.itemType === perm.itemType && 
              targetPerm.name === perm.name &&
              targetPerm.folderPath && perm.folderPath) {
            const normalizedTargetFolder = normalizePath(targetPerm.folderPath);
            const normalizedPermFolder = normalizePath(perm.folderPath);
            if (normalizedTargetFolder === normalizedPermFolder) {
              return perm;
            }
          }
          
          // Strategy 4: Match by name only (for items in root)
          if (targetPerm.name === perm.name &&
              targetPerm.itemType === perm.itemType &&
              ((!targetPerm.folderPath || targetPerm.folderPath === '/') &&
               (!perm.folderPath || perm.folderPath === '/'))) {
            return perm;
          }
        }
        return null;
      };
      
      console.log(`\n🔍 Starting mutual permissions calculation for ${usersToCheck.length} users`);
      
      // Start with first user's permissions
      const mutualItems = [];
      if (allUsersPermissions.length > 0) {
        allUsersPermissions[0].permissions.forEach(perm => {
          mutualItems.push({
            ...perm,
            userRoles: [new Set(perm.roles)]
          });
        });
      }
      
      // For each subsequent user, keep only items that also exist in their permissions
      for (let i = 1; i < allUsersPermissions.length; i++) {
        const currentUserPerms = allUsersPermissions[i].permissions;
        const currentUserName = allUsersPermissions[i].userName;
        console.log(`\n🔍 Finding mutual items with user "${currentUserName}" (${currentUserPerms.length} items)`);
        console.log(`   Starting with ${mutualItems.length} items from previous users`);
        
        // Filter mutual items - keep only items that exist in current user's permissions too
        const remainingMutualItems = [];
        for (const mutualItem of mutualItems) {
          const matchingPerm = findMatchingPermission(mutualItem, currentUserPerms);
          if (matchingPerm) {
            // Item exists in both - keep it and add roles
            console.log(`   ✓ MATCH: "${mutualItem.name}" (ID: ${mutualItem.id || 'N/A'}) - User 1 roles: [${Array.from(mutualItem.userRoles[0]).join(', ')}], User ${i + 1} roles: [${matchingPerm.roles.join(', ')}]`);
            mutualItem.userRoles.push(new Set(matchingPerm.roles));
            remainingMutualItems.push(mutualItem);
          } else {
            console.log(`   ✗ NO MATCH: "${mutualItem.name}" (ID: ${mutualItem.id || 'N/A'}, Path: ${mutualItem.path}) - not found in user "${currentUserName}" permissions`);
          }
        }
        
        console.log(`   → After filtering: ${remainingMutualItems.length} mutual items remain`);
        
        // Update mutualItems to only include items that matched
        mutualItems.length = 0;
        mutualItems.push(...remainingMutualItems);
      }
      
      // Convert mutual items back to permissions array with intersection of roles
      finalPermissions = mutualItems.map(item => {
        // Find intersection of roles (roles that ALL users have)
        let commonRoles = null;
        for (const roleSet of item.userRoles) {
          if (commonRoles === null) {
            commonRoles = new Set(roleSet);
          } else {
            // Keep only roles that exist in both sets
            commonRoles = new Set([...commonRoles].filter(role => roleSet.has(role)));
          }
        }
        
        // Remove userRoles property and set roles to intersection
        const { userRoles, ...permission } = item;
        return {
          ...permission,
          roles: commonRoles ? Array.from(commonRoles) : []
        };
      }).filter(perm => perm.roles.length > 0); // Only include items with at least one common role
      
      console.log(`✓ Found ${finalPermissions.length} mutual items with access for ${usersToCheck.length} users: ${usersToCheck.join(', ')}`);
      console.log(`   User 1 (${allUsersPermissions[0].userName}): ${allUsersPermissions[0].permissions.length} items`);
      for (let i = 1; i < allUsersPermissions.length; i++) {
        console.log(`   User ${i + 1} (${allUsersPermissions[i].userName}): ${allUsersPermissions[i].permissions.length} items`);
      }
    }

    res.json({ 
      success: true, 
      permissions: finalPermissions,
      userName: usersToCheck.length === 1 ? usersToCheck[0] : null,
      userNames: usersToCheck.length > 1 ? usersToCheck : null,
      totalChecked: catalogItems.length,
      isMutual: usersToCheck.length > 1
    });

  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({ 
      error: 'Failed to check permissions', 
      message: error.message 
    });
  }
});

/**
 * POST /api/permissions/set
 * Set permissions for an item
 */
router.post('/set', async (req, res) => {
  try {
    const { 
      serverUri, 
      itemId, 
      itemPath, 
      userName, 
      roles, 
      itemType 
    } = req.body;

    // Log permission set request (for production monitoring)

    if (!serverUri || !userName || !roles) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Get credentials from environment variables (SECURE!)
    const domain = process.env.PBI_DOMAIN;
    const user = process.env.PBI_USER;
    const password = process.env.PBI_PASSWORD;

    if (!domain || !user || !password) {
      return res.status(500).json({ 
        error: 'Server configuration error: PBI credentials not configured properly' 
      });
    }


    // Role definitions
    const roleDefinitions = {
      'Browser': {
        Name: 'Browser',
        Description: 'May view folders, reports and subscribe to reports.'
      },
      'Content Manager': {
        Name: 'Content Manager',
        Description: 'May manage content in the Report Server. This includes folders, reports and resources.'
      },
      'My Reports': {
        Name: 'My Reports',
        Description: 'May publish reports and linked reports; manage folders, reports and resources in a users My Reports folder.'
      },
      'Publisher': {
        Name: 'Publisher',
        Description: 'May publish reports and linked reports to the Report Server.'
      },
      'Report Builder': {
        Name: 'Report Builder',
        Description: 'May view report definitions.'
      }
    };

    // Build endpoints to try
    // IMPORTANT: For Persian characters, we need to URL-encode paths (like in /check endpoint)
    const getEndpoints = [];
    const setEndpoints = [];
    
    if (itemType === 'Folder' && itemPath) {
      // For folders, escape single quotes and URL-encode for Persian characters
      const escapedPath = itemPath.replace(/'/g, "''");
      const encodedPath = encodeURIComponent(escapedPath);
      // Try both encoded and non-encoded paths (some servers may handle differently)
      getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${encodedPath}')/Policies`);
      getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${encodedPath}')/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
    } else if (itemId) {
      // For reports, use ID-based endpoints first (most reliable for Persian characters)
      getEndpoints.push(`${serverUri}/api/v2.0/PowerBIReports(${itemId})/Policies`);
      getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(${itemId})/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/PowerBIReports(${itemId})/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(${itemId})/Policies`);
      
      // FALLBACK: If itemPath is provided and ID-based endpoints might fail, add path-based endpoints with URL encoding
      // This is critical for Persian-named reports where ID endpoints might not work
      if (itemPath) {
        const escapedPath = itemPath.replace(/'/g, "''");
        const encodedPath = encodeURIComponent(escapedPath);
        // Add path-based endpoints as fallback (with URL encoding for Persian characters)
        getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${encodedPath}')/Policies`);
        getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
        setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${encodedPath}')/Policies`);
        setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
      }
    } else if (itemPath) {
      // If no itemId but itemPath is provided (fallback case)
      const escapedPath = itemPath.replace(/'/g, "''");
      const encodedPath = encodeURIComponent(escapedPath);
      getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${encodedPath}')/Policies`);
      getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${encodedPath}')/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
    }

    // Get existing policies
    let existingPolicies = null;
    console.log(`🔍 [Set Permissions] Attempting to get existing policies for:`, {
      itemId,
      itemPath,
      itemType,
      userName,
      roles,
      getEndpointsCount: getEndpoints.length,
      getEndpoints: getEndpoints
    });
    
    for (const endpoint of getEndpoints) {
      try {
        existingPolicies = await ntlmGet(endpoint, domain, user, password);
        console.log(`✅ [Set Permissions] Successfully retrieved policies from: ${endpoint}`);
        break;
      } catch (error) {
        console.log(`  ❌ [Set Permissions] Failed to get from: ${endpoint} - ${error.message}`);
        continue;
      }
    }
    
    if (!existingPolicies) {
      console.log(`⚠️ [Set Permissions] Could not retrieve existing policies from any endpoint. Will create new policies.`);
    } else {
      console.log(`📋 [Set Permissions] Existing policies found:`, {
        policiesCount: existingPolicies.Policies ? existingPolicies.Policies.length : 0,
        existingUsers: existingPolicies.Policies ? existingPolicies.Policies.map(p => p.GroupUserName) : []
      });
    }

    // Build new policies array
    const policies = [];
    let userExists = false;
    const isRemovalRequest = roles.length === 0; // Empty roles array = remove permissions

    // Helper function to extract username from domain\username or just username
    const extractUsername = (fullName) => {
      if (!fullName) return '';
      const parts = fullName.split('\\');
      return parts.length > 1 ? parts[parts.length - 1] : parts[0]; // Get last part after backslash
    };

    // Normalize input username (extract username part if domain\username format)
    const inputUserNameNormalized = extractUsername(userName).toLowerCase().trim();

    if (existingPolicies && existingPolicies.Policies) {
      existingPolicies.Policies.forEach(policy => {
        // Extract username from policy (handle both "domain\username" and "username" formats)
        const policyUserNameNormalized = extractUsername(policy.GroupUserName).toLowerCase().trim();
        
        // Do exact match on normalized usernames (not substring match)
        // This prevents "cheraghia" from matching "cheraghial"
        const isMatch = policyUserNameNormalized === inputUserNameNormalized;
        
        console.log(`  🔍 [Set Permissions] Comparing users:`, {
          policyGroupUserName: policy.GroupUserName,
          policyUserNameNormalized,
          inputUserName: userName,
          inputUserNameNormalized,
          isMatch
        });

        if (isMatch) {
          userExists = true;
          
          if (isRemovalRequest) {
            // REMOVE: Don't add this user to the policies array
            // Simply don't push this policy - effectively removing the user
            console.log(`  🗑️ [Set Permissions] Removing user: ${policy.GroupUserName}`);
            return;
          } else {
            // UPDATE: REPLACE roles (not merge) - use the exact roles sent
            const roleObjects = roles.map(roleName => roleDefinitions[roleName]).filter(r => r);
            
            if (roleObjects.length === 0) {
              return;
            }

            console.log(`  ✏️ [Set Permissions] Updating user: ${policy.GroupUserName} with roles:`, roles);
            policies.push({
              GroupUserName: policy.GroupUserName, // Keep original format (domain\username)
              Roles: roleObjects
            });
          }
        } else {
          // Keep other users as-is
          policies.push({
            GroupUserName: policy.GroupUserName,
            Roles: policy.Roles
          });
        }
      });
    }

    if (!userExists && !isRemovalRequest) {
      // Add new user (only if not a removal request)
      const roleObjects = roles.map(roleName => roleDefinitions[roleName]).filter(r => r);
      if (roleObjects.length > 0) {
        // Format username as domain\username if it's not already in that format
        // Check if userName already contains domain (has backslash)
        let formattedUserName = userName;
        if (!userName.includes('\\')) {
          // If no domain specified, try to infer from existing policies or use as-is
          // For now, use as-is - Power BI will handle it
          formattedUserName = userName;
        }
        
        console.log(`  ➕ [Set Permissions] Adding new user: ${formattedUserName} with roles:`, roles);
        policies.push({
          GroupUserName: formattedUserName,
          Roles: roleObjects
        });
      }
    }

    // Set policies using NTLM
    const requestBody = { Policies: policies };
    
    console.log(`📤 [Set Permissions] Attempting to set permissions:`, {
      userName,
      roles,
      itemId,
      itemPath,
      itemType,
      policiesCount: policies.length,
      policies: policies.map(p => ({ user: p.GroupUserName, roles: p.Roles.map(r => r.Name) })),
      setEndpointsCount: setEndpoints.length,
      setEndpoints: setEndpoints
    });

    let success = false;
    let lastError = null;
    let successfulEndpoint = null;

    for (const endpoint of setEndpoints) {
      try {
        console.log(`  🔄 [Set Permissions] Trying endpoint: ${endpoint}`);
        await ntlmPut(endpoint, domain, user, password, requestBody);
        // Successfully set permissions
        success = true;
        successfulEndpoint = endpoint;
        console.log(`  ✅ [Set Permissions] Successfully set permissions via: ${endpoint}`);
        break;
      } catch (error) {
        lastError = error.message;
        console.error(`  ❌ [Set Permissions] Failed at ${endpoint}: ${error.message}`);
      }
    }
    
    if (success) {
      console.log(`✅ [Set Permissions] Successfully set permissions for ${userName} on ${itemId || itemPath} via ${successfulEndpoint}`);
    } else {
      console.error(`❌ [Set Permissions] Failed to set permissions for ${userName} on ${itemId || itemPath}. All endpoints failed. Last error: ${lastError}`);
    }

    if (success) {
      res.json({ success: true, message: 'Permissions set successfully' });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to set permissions', 
        message: lastError 
      });
    }

  } catch (error) {
    console.error('Error setting permissions:', error);
    res.status(500).json({ 
      error: 'Failed to set permissions', 
      message: error.message 
    });
  }
});

module.exports = router;
