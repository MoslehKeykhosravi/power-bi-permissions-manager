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

    // Check permissions for each item - OPTIMIZED with parallel requests
    const userPermissions = [];
    const userNameLower = userName.toLowerCase();
    
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
              
              // More flexible matching: check if username appears in policy or vice versa
              // Try multiple matching strategies:
              // 1. Exact match (case-insensitive)
              // 2. Username only match (ignoring domain)
              // 3. Contains match (either direction)
              const isMatch = policyUserName === userNameLower ||
                              policyUserNameOnly === userNameOnly ||
                              policyUserName === userNameOnly ||
                              userNameOnly === policyUserName ||
                              policyUserName.includes(userNameLower) || 
                              userNameLower.includes(policyUserName) ||
                              policyUserName.includes(userNameOnly) ||
                              userNameOnly.includes(policyUserNameOnly);
              
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
            
            if (!matchedPolicy && policies.Policies.length > 0) {
              const isPersianItem = /[\u0600-\u06FF]/.test(itemPath) || /[\u0600-\u06FF]/.test(itemName);
              if (isPersianItem) {
                console.warn(`  ⚠️  No policy match for "${itemPath}". Looking for user: "${userName}", found policies: ${policies.Policies.map(p => p.GroupUserName || 'N/A').join(', ')}`);
              }
            }

            if (userRoles.length > 0) {
              // For reports, the path might include the report name or might not
              // Extract the actual folder path and report name separately
              let folderPath = itemPath;
              let reportName = item.Name || itemPath.split('/').pop();
              
              // If this is a report (not a folder), try to extract folder path
              if (itemType !== 'Folder' && item.Name) {
                // For reports, CatalogItems API Path might include the report name
                // Handle both cases: "/folder/report" and "/report" (root folder)
                const pathWithoutTrailingSlash = itemPath.replace(/\/$/, '');
                const nameWithSlash = `/${item.Name}`;
                
                // Check if path ends with "/reportName" (most common case)
                if (pathWithoutTrailingSlash.endsWith(nameWithSlash)) {
                  // Extract folder path by removing "/reportName" from the end
                  folderPath = pathWithoutTrailingSlash.substring(0, pathWithoutTrailingSlash.length - nameWithSlash.length) || '/';
                } else if (pathWithoutTrailingSlash === item.Name) {
                  // Path is exactly the report name without leading slash (root folder)
                  // e.g., path = "سرمایه انسانی", name = "سرمایه انسانی"
                  folderPath = '/';
                } else if (itemPath === `/${item.Name}`) {
                  // Path is exactly "/reportName" (root folder with leading slash)
                  // e.g., path = "/سرمایه انسانی", name = "سرمایه انسانی"
                  folderPath = '/';
                } else {
                  // Path doesn't end with name, assume path is just the folder path
                  // This handles cases where CatalogItems returns folder path only
                  folderPath = itemPath;
                }
              } else if (itemType === 'Folder') {
                // For folders, the path is the folder path itself
                folderPath = itemPath;
              }
              
              const resultObject = {
                path: itemPath, // Full path from catalog
                folderPath: folderPath, // Folder path only (for matching)
                name: reportName, // Report/folder name
                itemType: itemType === 'Folder' ? 'Folder' : 'Report',
                type: itemType,
                roles: userRoles,
                id: item.Id || null, // Include item ID for better matching
                catalogType: itemType
              };
              // Log successful permission check (keep for production monitoring)
              console.log(`✓ Found access for "${itemPath}" (ID: ${item.Id || 'N/A'}): roles = [${userRoles.join(', ')}]`);
              return resultObject;
            }
          }
          return null;
        } catch (error) {
          // Log errors for Persian items to help debug
          const isPersianItem = /[\u0600-\u06FF]/.test(itemPath) || /[\u0600-\u06FF]/.test(itemName || '');
          if (isPersianItem) {
            console.error(`  ❌ ERROR checking permissions for "${itemPath}":`, error.message);
            console.error(`     Stack:`, error.stack);
          }
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

    if (existingPolicies && existingPolicies.Policies) {
      existingPolicies.Policies.forEach(policy => {
        const policyUserName = policy.GroupUserName.toLowerCase();
        const inputUserName = userName.toLowerCase();

        if (policyUserName.includes(inputUserName) || inputUserName.includes(policyUserName)) {
          userExists = true;
          
          if (isRemovalRequest) {
            // REMOVE: Don't add this user to the policies array
            // Simply don't push this policy - effectively removing the user
            return;
          } else {
            // UPDATE: REPLACE roles (not merge) - use the exact roles sent
            const roleObjects = roles.map(roleName => roleDefinitions[roleName]).filter(r => r);
            
            if (roleObjects.length === 0) {
              return;
            }

            policies.push({
              GroupUserName: policy.GroupUserName,
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
        policies.push({
          GroupUserName: userName,
          Roles: roleObjects
        });
      }
    }

    // Set policies using NTLM
    const requestBody = { Policies: policies };

    let success = false;
    let lastError = null;

    for (const endpoint of setEndpoints) {
      try {
        await ntlmPut(endpoint, domain, user, password, requestBody);
        // Successfully set permissions
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
