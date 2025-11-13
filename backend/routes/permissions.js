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
        console.log(`  NTLM GET Response: HTTP ${response.statusCode}`);
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
    console.log(`  NTLM PUT - URL: ${url}`);
    console.log(`  NTLM Auth - Domain: "${domain}", User: "${user}"`);
    console.log(`  NTLM Body:`, JSON.stringify(body, null, 2));
    
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
        console.log(`  NTLM PUT Response: HTTP ${response.statusCode}`);
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
 * Check all permissions for a specific user across all reports/folders
 */
router.post('/check', async (req, res) => {
  try {
    const { serverUri, userName } = req.body;

    if (!serverUri || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields: serverUri and userName' 
      });
    }

    console.log('=== CHECK PERMISSIONS REQUEST ===');
    console.log(`Server URI: ${serverUri}`);
    console.log(`User Name: ${userName}`);

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

    // Check permissions for each item - OPTIMIZED with parallel requests
    const userPermissions = [];
    const userNameLower = userName.toLowerCase();
    
    // Filter out invalid items first
    const validItems = catalogItems.filter(item => {
      const itemPath = item.Path;
      return itemPath && itemPath !== '/';
    });

    console.log(`  Checking permissions for ${validItems.length} items in parallel batches...`);

    // Process items in parallel batches to avoid overwhelming the server
    const BATCH_SIZE = 20; // Process 20 items at a time
    const batches = [];
    
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
      batches.push(validItems.slice(i, i + BATCH_SIZE));
    }

    // Process each batch in parallel
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`  Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)...`);
      
      // Create parallel requests for this batch
      const batchPromises = batch.map(async (item) => {
        const itemPath = item.Path;
        const itemType = item.Type; // 'Folder', 'PowerBIReport', 'Report', etc.

        try {
          const escapedPath = itemPath.replace(/'/g, "''");
          const policyEndpoint = `${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`;
          
          const policies = await ntlmGet(policyEndpoint, domain, user, password);
          
          if (policies && policies.Policies) {
            // Check if user has access and collect roles
            const userRoles = [];
            let matchedPolicy = false;
            policies.Policies.forEach(policy => {
              const policyUserName = (policy.GroupUserName || '').toLowerCase();
              // More flexible matching: check if username appears in policy or vice versa
              const isMatch = policyUserName.includes(userNameLower) || 
                              userNameLower.includes(policyUserName) ||
                              policyUserName === userNameLower;
              
              if (isMatch) {
                matchedPolicy = true;
                // Add roles from this policy
                if (policy.Roles && Array.isArray(policy.Roles)) {
                  policy.Roles.forEach(role => {
                    if (role && role.Name && !userRoles.includes(role.Name)) {
                      userRoles.push(role.Name);
                    }
                  });
                } else {
                  console.log(`  Policy matched but no roles array for: ${itemPath}`);
                }
              }
            });
            
            if (matchedPolicy && policies.Policies.length > 0) {
              console.log(`  Item: ${itemPath} - Matched: ${matchedPolicy}, Roles: [${userRoles.join(', ') || 'NONE'}]`);
            }

            if (userRoles.length > 0) {
              const resultObject = {
                path: itemPath,
                itemType: itemType === 'Folder' ? 'Folder' : 'Report',
                name: item.Name || itemPath.split('/').pop(),
                type: itemType,
                roles: userRoles
              };
              console.log(`✓ Found access for "${itemPath}": roles = [${userRoles.join(', ')}]`);
              return resultObject;
            } else {
              console.log(`  No roles found for "${itemPath}"`);
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

    console.log(`✓ Found ${userPermissions.length} items with access for user "${userName}"`);

    res.json({ 
      success: true, 
      permissions: userPermissions,
      userName: userName,
      totalChecked: catalogItems.length
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

    console.log('=== SET PERMISSIONS REQUEST ===');
    console.log(`Item ID: ${itemId}`);
    console.log(`Item Path: ${itemPath}`);
    console.log(`Target User: ${userName}`);
    console.log(`Roles: ${roles.join(', ')}`);
    console.log(`Item Type: ${itemType}`);

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

    console.log(`Using auth credentials - Domain: ${domain}, User: ${user}`);

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
    const getEndpoints = [];
    const setEndpoints = [];
    
    if (itemType === 'Folder' && itemPath) {
      const escapedPath = itemPath.replace(/'/g, "''");
      getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(Path='${escapedPath}')/Policies`);
    } else if (itemId) {
      getEndpoints.push(`${serverUri}/api/v2.0/PowerBIReports(${itemId})/Policies`);
      getEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(${itemId})/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/PowerBIReports(${itemId})/Policies`);
      setEndpoints.push(`${serverUri}/api/v2.0/CatalogItems(${itemId})/Policies`);
    }

    // Get existing policies
    let existingPolicies = null;
    for (const endpoint of getEndpoints) {
      try {
        existingPolicies = await ntlmGet(endpoint, domain, user, password);
        console.log(`✓ Retrieved existing policies from: ${endpoint}`);
        break;
      } catch (error) {
        console.log(`  Failed to get from: ${endpoint} - ${error.message}`);
        continue;
      }
    }

    // Build new policies array
    const policies = [];
    let userExists = false;
    const isRemovalRequest = roles.length === 0; // Empty roles array = remove permissions

    if (isRemovalRequest) {
      console.log(`  🗑️  REMOVAL REQUEST: Removing all permissions for "${userName}"`);
    }

    if (existingPolicies && existingPolicies.Policies) {
      console.log(`  Found ${existingPolicies.Policies.length} existing policies`);
      existingPolicies.Policies.forEach(policy => {
        const policyUserName = policy.GroupUserName.toLowerCase();
        const inputUserName = userName.toLowerCase();

        if (policyUserName.includes(inputUserName) || inputUserName.includes(policyUserName)) {
          userExists = true;
          
          if (isRemovalRequest) {
            // REMOVE: Don't add this user to the policies array
            console.log(`  ✓ Removing user "${policy.GroupUserName}" from policies`);
            // Simply don't push this policy - effectively removing the user
            return;
          } else {
            // UPDATE: REPLACE roles (not merge) - use the exact roles sent
            const roleObjects = roles.map(roleName => roleDefinitions[roleName]).filter(r => r);
            
            if (roleObjects.length === 0) {
              console.log(`  ⚠️  No valid roles provided - skipping user update`);
              return;
            }

            policies.push({
              GroupUserName: policy.GroupUserName,
              Roles: roleObjects
            });
            console.log(`  Updated user "${policy.GroupUserName}" - REPLACED roles with: ${roles.join(', ')}`);
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
        policies.push({
          GroupUserName: userName,
          Roles: roleObjects
        });
        console.log(`  Adding new user "${userName}" with roles: ${roles.join(', ')}`);
      }
    } else if (!userExists && isRemovalRequest) {
      console.log(`  ⚠️  User "${userName}" not found in existing policies - nothing to remove`);
    }

    if (isRemovalRequest && userExists) {
      console.log(`  ✓ User will be removed. New policy count: ${policies.length}`);
    }

    console.log(`  Total policies to send: ${policies.length}`);

    // Set policies using NTLM
    const requestBody = { Policies: policies };

    let success = false;
    let lastError = null;

    for (const endpoint of setEndpoints) {
      try {
        console.log(`  Attempting to set policies at: ${endpoint}`);
        await ntlmPut(endpoint, domain, user, password, requestBody);
        console.log(`✓ Successfully set permissions at: ${endpoint}`);
        success = true;
        break;
      } catch (error) {
        lastError = error.message;
        console.error(`  Failed at ${endpoint}: ${error.message}`);
      }
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
