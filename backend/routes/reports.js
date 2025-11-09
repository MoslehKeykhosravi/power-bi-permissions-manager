const express = require('express');
const router = express.Router();
const axios = require('axios');
const httpntlm = require('httpntlm');

/**
 * GET /api/reports
 * Fetch all reports from Power BI Report Server
 */
router.post('/list', async (req, res) => {
  try {
    const { serverUri } = req.body;

    if (!serverUri) {
      return res.status(400).json({ 
        error: 'Missing required field: serverUri' 
      });
    }

    // Get credentials from environment variables (SECURE!)
    const domain = process.env.PBI_DOMAIN;
    const user = process.env.PBI_USER;
    const password = process.env.PBI_PASSWORD;

    if (!domain || !user || !password) {
      console.error('❌ PBI credentials not set in environment variables!');
      return res.status(500).json({ 
        error: 'Server configuration error: PBI credentials not configured properly' 
      });
    }

    console.log(`Using credentials from environment - Domain: ${domain}, User: ${user}`);

    const allReports = [];
    const errors = [];

    // Helper function to make NTLM request
    const ntlmRequest = (url) => {
      return new Promise((resolve, reject) => {
        console.log(`  NTLM Request - URL: ${url}`);
        console.log(`  NTLM Request - Domain: "${domain}", User: "${user}"`);
        
        const options = {
          url: url,
          username: user,
          password: password,
          workstation: '',
          domain: domain,
          headers: {
            'Accept': 'application/json; charset=utf-8',
            'Accept-Charset': 'utf-8'
          }
        };
        
        httpntlm.get(options, (err, response) => {
          if (err) {
            console.error(`  NTLM Error: ${err.message}`);
            reject(err);
          } else {
            console.log(`  NTLM Response: HTTP ${response.statusCode}`);
            if (response.statusCode !== 200) {
              console.error(`  Response body: ${response.body ? response.body.substring(0, 200) : 'empty'}`);
              reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage || 'Authentication failed'}`));
            } else {
              try {
                const data = JSON.parse(response.body);
                console.log(`  NTLM Success: Parsed JSON data`);
                resolve(data);
              } catch (parseErr) {
                console.error(`  JSON Parse Error: ${parseErr.message}`);
                reject(new Error('Invalid JSON response'));
              }
            }
          }
        });
      });
    };

    // Fetch Power BI Reports (PBIX)
    try {
      const pbixUrl = `${serverUri}/api/v2.0/PowerBIReports`;
      console.log(`Attempting to fetch Power BI Reports from: ${pbixUrl}`);
      console.log(`  Using NTLM auth - Domain: ${domain}, User: ${user}`);
      
      const pbixData = await ntlmRequest(pbixUrl);

      if (pbixData && pbixData.value) {
        console.log(`✓ Found ${pbixData.value.length} Power BI Reports (PBIX)`);
        pbixData.value.forEach(report => {
          const path = report.Path || '/';
          allReports.push({
            id: report.Id,
            name: report.Name,
            path: path,
            type: 'Power BI (PBIX)',
            fullPath: path === '/' ? `/${report.Name}` : `${path}/${report.Name}`
          });
        });
      }
    } catch (error) {
      const errorMsg = `Power BI Reports: ${error.message}`;
      console.error(`✗ ${errorMsg}`);
      errors.push(errorMsg);
    }

    // Fetch Paginated Reports (RDL)
    try {
      const rdlUrl = `${serverUri}/api/v2.0/Reports`;
      console.log(`Attempting to fetch Paginated Reports from: ${rdlUrl}`);
      
      const rdlData = await ntlmRequest(rdlUrl);

      if (rdlData && rdlData.value) {
        console.log(`✓ Found ${rdlData.value.length} Paginated Reports (RDL)`);
        rdlData.value.forEach(report => {
          const path = report.Path || '/';
          allReports.push({
            id: report.Id,
            name: report.Name,
            path: path,
            type: 'Paginated (RDL)',
            fullPath: path === '/' ? `/${report.Name}` : `${path}/${report.Name}`
          });
        });
      }
    } catch (error) {
      const errorMsg = `Paginated Reports: ${error.message}`;
      console.error(`✗ ${errorMsg}`);
      errors.push(errorMsg);
    }

    console.log(`✓ Total reports found: ${allReports.length}`);
    if (errors.length > 0) {
      console.log(`⚠ Errors encountered: ${errors.join(', ')}`);
    }

    res.json({
      success: true,
      reports: allReports,
      errors: errors.length > 0 ? errors : null,
      count: allReports.length
    });

  } catch (error) {
    console.error('✗ Error fetching reports:', error.message);
    console.error('  Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch reports', 
      message: error.message 
    });
  }
});

/**
 * POST /api/reports/rename
 * Rename a report or folder
 */
router.post('/rename', async (req, res) => {
  try {
    const { serverUri, itemId, itemType, newName } = req.body;

    if (!serverUri || !itemId || !newName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: { serverUri: !!serverUri, itemId: !!itemId, newName: !!newName }
      });
    }

    // Get credentials from environment variables (same as /list endpoint)
    const domain = process.env.PBI_DOMAIN;
    const user = process.env.PBI_USER;
    const password = process.env.PBI_PASSWORD;

    if (!domain || !user || !password) {
      console.error('❌ PBI credentials not set in environment variables!');
      return res.status(500).json({ 
        error: 'Server configuration error: PBI credentials not configured properly' 
      });
    }

    console.log(`Rename request - Domain: ${domain}, User: ${user}, ItemType: ${itemType}`);
    console.log(`ItemId: ${itemId}, New Name: ${newName}`);

    // Helper function to make NTLM GET request
    const ntlmGetRequest = (url) => {
      return new Promise((resolve, reject) => {
        console.log(`  NTLM GET Request - URL: ${url}`);
        
        const options = {
          url: url,
          username: user,
          password: password,
          workstation: '',
          domain: domain,
          headers: {
            'Accept': 'application/json; charset=utf-8'
          }
        };
        
        httpntlm.get(options, (err, response) => {
          if (err) {
            console.error(`  NTLM GET Error: ${err.message}`);
            reject(err);
          } else {
            console.log(`  NTLM GET Response: HTTP ${response.statusCode}`);
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage || 'Request failed'}`));
            } else {
              try {
                const data = JSON.parse(response.body);
                resolve(data);
              } catch (parseErr) {
                reject(new Error('Invalid JSON response'));
              }
            }
          }
        });
      });
    };

    // Helper function to make NTLM PATCH request
    const ntlmPatchRequest = (url, body) => {
      return new Promise((resolve, reject) => {
        console.log(`  NTLM PATCH Request - URL: ${url}`);
        console.log(`  NTLM PATCH Request - Domain: "${domain}", User: "${user}"`);
        console.log(`  Request Body:`, JSON.stringify(body));
        
        const options = {
          url: url,
          username: user,
          password: password,
          workstation: '',
          domain: domain,
          headers: {
            'Accept': 'application/json; charset=utf-8',
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(body)
        };
        
        // httpntlm.patch for PATCH requests
        httpntlm.patch(options, (err, response) => {
          if (err) {
            console.error(`  NTLM Error: ${err.message}`);
            reject(err);
          } else {
            console.log(`  NTLM Response: HTTP ${response.statusCode}`);
            if (response.body) {
              console.log(`  Response Body:`, String(response.body).substring(0, 500));
            }
            
            if (response.statusCode !== 200 && response.statusCode !== 204) {
              const errorMsg = response.statusMessage || 'Request failed';
              let detailMsg = errorMsg;
              
              // Try to parse error details from response body
              if (response.body) {
                try {
                  const errorBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
                  detailMsg = errorBody?.error?.message || errorBody?.message || errorMsg;
                } catch (e) {
                  // If parsing fails, use the raw response
                  detailMsg = String(response.body).substring(0, 200);
                }
              }
              
              reject(new Error(`HTTP ${response.statusCode}: ${detailMsg}`));
            } else {
              console.log(`  NTLM Success: Item renamed`);
              resolve({ statusCode: response.statusCode, body: response.body });
            }
          }
        });
      });
    };

    // For folders, we need to first GET the folder to retrieve its ID
    // For reports, itemId is already the GUID
    let folderId = null;
    
    if (itemType === 'Folder') {
      try {
        console.log(`Fetching folder details for path: ${itemId}`);
        const folderUrl = `${serverUri}/api/v2.0/Folders(Path='${itemId}')`;
        const folderData = await ntlmGetRequest(folderUrl);
        folderId = folderData.Id;
        console.log(`✓ Found folder ID: ${folderId}`);
      } catch (error) {
        console.error(`✗ Failed to fetch folder:`, error.message);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to find folder', 
          message: `Could not find folder at path: ${itemId}. Error: ${error.message}`
        });
      }
    }
    
    // Build endpoints for PATCH request
    const endpoints = itemType === 'Folder' 
      ? [`${serverUri}/api/v2.0/Folders(${folderId})`]
      : [
          `${serverUri}/api/v2.0/PowerBIReports(${itemId})`,
          `${serverUri}/api/v2.0/Reports(${itemId})`
        ];

    let success = false;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Attempting to rename via: ${endpoint}`);
        console.log(`New name: ${newName}`);
        
        await ntlmPatchRequest(endpoint, { Name: newName });
        console.log(`✓ Successfully renamed via ${endpoint}`);
        
        success = true;
        break;
      } catch (error) {
        console.error(`✗ Failed to rename via ${endpoint}:`, error.message);
        lastError = error.message;
      }
    }

    if (success) {
      res.json({ success: true, message: 'Item renamed successfully' });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to rename item', 
        message: lastError 
      });
    }

  } catch (error) {
    console.error('Error renaming item:', error);
    res.status(500).json({ 
      error: 'Failed to rename item', 
      message: error.message 
    });
  }
});

module.exports = router;

