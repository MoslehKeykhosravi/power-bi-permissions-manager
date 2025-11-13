const express = require('express');
const router = express.Router();

/**
 * GET /api/config/servers
 * Get list of predefined servers from environment
 */
router.get('/servers', (req, res) => {
  try {
    // Load servers from environment or default configuration
    let servers = [];
    
    // Try to get from PBI_SERVERS environment variable first
    if (process.env.PBI_SERVERS) {
      servers = JSON.parse(process.env.PBI_SERVERS);
    } else {
      // Otherwise, get from PBI_SERVER_URL_1, PBI_SERVER_URL_2, PBI_SERVER_URL_3
      if (process.env.PBI_SERVER_URL_1) servers.push(process.env.PBI_SERVER_URL_1);
      if (process.env.PBI_SERVER_URL_2) servers.push(process.env.PBI_SERVER_URL_2);
      if (process.env.PBI_SERVER_URL_3) servers.push(process.env.PBI_SERVER_URL_3);
    }

    // Include AD configuration if available
    const adConfig = {
      ldapUrl: process.env.LDAP_URL || null,
      bindDN: process.env.LDAP_BIND_DN || null,
      bindPassword: process.env.LDAP_BIND_PASSWORD || null,
      searchBase: process.env.LDAP_SEARCH_BASE || null
    };

    // Check if AD config is complete
    const hasAdConfig = adConfig.ldapUrl && adConfig.bindDN && 
                       adConfig.bindPassword && adConfig.searchBase;

    res.json({
      success: true,
      servers: servers,
      adConfig: hasAdConfig ? adConfig : null
    });

  } catch (error) {
    console.error('Error getting servers:', error);
    res.status(500).json({ 
      error: 'Failed to get servers', 
      message: error.message 
    });
  }
});

module.exports = router;

