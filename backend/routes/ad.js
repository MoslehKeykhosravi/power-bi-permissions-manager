const express = require('express');
const router = express.Router();
const ldap = require('ldapjs');
const adHelper = require('../utils/adHelper');

/**
 * POST /api/ad/search
 * Search Active Directory for users and groups
 */
router.post('/search', async (req, res) => {
  try {
    const { 
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase, 
      searchFilter = '*' 
    } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase) {
      return res.status(400).json({ 
        error: 'Missing required AD configuration fields' 
      });
    }

    const client = ldap.createClient({
      url: ldapUrl,
      timeout: 5000,
      connectTimeout: 10000
    });

    // Bind to LDAP
    await new Promise((resolve, reject) => {
      client.bind(bindDN, bindPassword, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const results = [];
    const maxResults = 500;

    // Improve search filter - add wildcards for partial matching and search more fields
    const searchPattern = searchFilter.includes('*') ? searchFilter : `*${searchFilter}*`;
    
    // Search for users - search in multiple fields with wildcards
    const userFilter = `(&(objectCategory=person)(objectClass=user)(|(cn=${searchPattern})(sAMAccountName=${searchPattern})(displayName=${searchPattern})))`;
    const userSearchOptions = {
      filter: userFilter,
      scope: 'sub',
      attributes: ['sAMAccountName', 'displayName', 'department', 'cn', 'userAccountControl'],
      sizeLimit: maxResults
    };

    await new Promise((resolve, reject) => {
      client.search(searchBase, userSearchOptions, (err, searchRes) => {
        if (err) {
          reject(err);
          return;
        }

        searchRes.on('searchEntry', (entry) => {
          try {
            const obj = entry.object || {};
            const attrs = entry.attributes || [];
            
            // Get attribute values safely
            const getAttribute = (name) => {
              const attr = attrs.find(a => a.type && a.type.toLowerCase() === name.toLowerCase());
              return attr && attr.values && attr.values[0] ? attr.values[0] : null;
            };
            
            const sAMAccountName = obj.sAMAccountName || getAttribute('sAMAccountName');
            const displayName = obj.displayName || getAttribute('displayName');
            const department = obj.department || getAttribute('department');
            const userAccountControl = obj.userAccountControl || getAttribute('userAccountControl');
            
            // Check if account is active (bit 2 of userAccountControl = ACCOUNTDISABLE)
            const uac = parseInt(userAccountControl || '0');
            const isActive = !(uac & 0x0002);
            
            if (sAMAccountName) {
              results.push({
                name: sAMAccountName,
                displayText: `${displayName || sAMAccountName} (${sAMAccountName})${department ? ' [' + department + ']' : ''}`,
                type: 'User',
                isActive: isActive
              });
            }
          } catch (err) {
            console.error('Error processing user entry:', err);
          }
        });

        searchRes.on('error', (err) => {
          reject(err);
        });

        searchRes.on('end', () => {
          resolve();
        });
      });
    });

    // Search for groups - use same wildcard pattern
    const groupFilter = `(&(objectCategory=group)(|(cn=${searchPattern})(sAMAccountName=${searchPattern})(name=${searchPattern})))`;
    const groupSearchOptions = {
      filter: groupFilter,
      scope: 'sub',
      attributes: ['sAMAccountName', 'name', 'description', 'cn'],
      sizeLimit: maxResults
    };

    await new Promise((resolve, reject) => {
      client.search(searchBase, groupSearchOptions, (err, searchRes) => {
        if (err) {
          reject(err);
          return;
        }

        searchRes.on('searchEntry', (entry) => {
          try {
            const obj = entry.object || {};
            const attrs = entry.attributes || [];
            
            // Get attribute values safely
            const getAttribute = (name) => {
              const attr = attrs.find(a => a.type && a.type.toLowerCase() === name.toLowerCase());
              return attr && attr.values && attr.values[0] ? attr.values[0] : null;
            };
            
            const sAMAccountName = obj.sAMAccountName || getAttribute('sAMAccountName');
            const name = obj.name || getAttribute('name');
            const description = obj.description || getAttribute('description');
            
            if (sAMAccountName) {
              results.push({
                name: sAMAccountName,
                displayText: `${name || sAMAccountName}${description ? ' - ' + description : ''}`,
                type: 'Group'
              });
            }
          } catch (err) {
            console.error('Error processing group entry:', err);
          }
        });

        searchRes.on('error', (err) => {
          reject(err);
        });

        searchRes.on('end', () => {
          resolve();
        });
      });
    });

    client.unbind();

    res.json({
      success: true,
      results: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error searching AD:', error);
    res.status(500).json({ 
      error: 'Failed to search Active Directory', 
      message: error.message,
      hint: 'Make sure LDAP configuration is correct and the server is accessible'
    });
  }
});

/**
 * POST /api/ad/user/details
 * Get detailed information about a specific user
 */
router.post('/user/details', async (req, res) => {
  try {
    const { ldapUrl, bindDN, bindPassword, searchBase, userName } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ldapUrl', 'bindDN', 'bindPassword', 'searchBase', 'userName']
      });
    }

    console.log(`Getting details for user: ${userName}`);

    const userDetails = await adHelper.getUserDetails(
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase, 
      userName
    );

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userDetails
    });

  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ 
      error: 'Failed to get user details', 
      message: error.message
    });
  }
});

/**
 * POST /api/ad/group/members
 * Get members of an AD group
 */
router.post('/group/members', async (req, res) => {
  try {
    const { ldapUrl, bindDN, bindPassword, searchBase, groupName } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase || !groupName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ldapUrl', 'bindDN', 'bindPassword', 'searchBase', 'groupName']
      });
    }

    console.log(`Getting members for group: ${groupName}`);

    const { group, members } = await adHelper.getGroupMembers(
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase, 
      groupName
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    res.json({
      success: true,
      group: group,
      members: members,
      count: members.length
    });

  } catch (error) {
    console.error('Error getting group members:', error);
    res.status(500).json({ 
      error: 'Failed to get group members', 
      message: error.message
    });
  }
});

/**
 * POST /api/ad/user/direct-reports
 * Get user's direct reports (subordinates)
 */
router.post('/user/direct-reports', async (req, res) => {
  try {
    const { ldapUrl, bindDN, bindPassword, searchBase, userName } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ldapUrl', 'bindDN', 'bindPassword', 'searchBase', 'userName']
      });
    }

    console.log(`Getting direct reports for user: ${userName}`);

    const directReports = await adHelper.getDirectReports(
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase, 
      userName
    );

    res.json({
      success: true,
      directReports: directReports,
      count: directReports.length
    });

  } catch (error) {
    console.error('Error getting direct reports:', error);
    res.status(500).json({ 
      error: 'Failed to get direct reports', 
      message: error.message
    });
  }
});

/**
 * POST /api/ad/user/manager-chain
 * Get organizational hierarchy (manager chain) for a user
 */
router.post('/user/manager-chain', async (req, res) => {
  try {
    const { ldapUrl, bindDN, bindPassword, searchBase, userName } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ldapUrl', 'bindDN', 'bindPassword', 'searchBase', 'userName']
      });
    }

    console.log(`Getting manager chain for user: ${userName}`);

    const managerChain = await adHelper.getManagerChain(
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase, 
      userName
    );

    res.json({
      success: true,
      managerChain: managerChain,
      levels: managerChain.length
    });

  } catch (error) {
    console.error('Error getting manager chain:', error);
    res.status(500).json({ 
      error: 'Failed to get manager chain', 
      message: error.message
    });
  }
});

/**
 * POST /api/ad/search/department
 * Search users by department
 */
router.post('/search/department', async (req, res) => {
  try {
    const { ldapUrl, bindDN, bindPassword, searchBase, department } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase || !department) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ldapUrl', 'bindDN', 'bindPassword', 'searchBase', 'department']
      });
    }

    console.log(`Searching users in department: ${department}`);

    const users = await adHelper.searchByDepartment(
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase, 
      department
    );

    res.json({
      success: true,
      users: users,
      count: users.length,
      department: department
    });

  } catch (error) {
    console.error('Error searching by department:', error);
    res.status(500).json({ 
      error: 'Failed to search by department', 
      message: error.message
    });
  }
});

/**
 * POST /api/ad/departments
 * Get list of all departments
 */
router.post('/departments', async (req, res) => {
  try {
    const { ldapUrl, bindDN, bindPassword, searchBase } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ldapUrl', 'bindDN', 'bindPassword', 'searchBase']
      });
    }

    console.log('Getting all departments...');

    const departments = await adHelper.getAllDepartments(
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase
    );

    res.json({
      success: true,
      departments: departments,
      count: departments.length
    });

  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({ 
      error: 'Failed to get departments', 
      message: error.message
    });
  }
});

/**
 * POST /api/ad/locations
 * Get list of all locations/offices
 */
router.post('/locations', async (req, res) => {
  try {
    const { ldapUrl, bindDN, bindPassword, searchBase } = req.body;

    if (!ldapUrl || !bindDN || !bindPassword || !searchBase) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ldapUrl', 'bindDN', 'bindPassword', 'searchBase']
      });
    }

    console.log('Getting all locations...');

    const locations = await adHelper.getAllLocations(
      ldapUrl, 
      bindDN, 
      bindPassword, 
      searchBase
    );

    res.json({
      success: true,
      locations: locations,
      count: locations.length
    });

  } catch (error) {
    console.error('Error getting locations:', error);
    res.status(500).json({ 
      error: 'Failed to get locations', 
      message: error.message
    });
  }
});

module.exports = router;

