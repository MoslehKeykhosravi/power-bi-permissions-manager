const express = require('express');
const router = express.Router();
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/config/load
 * Load server configuration from XML file
 */
router.post('/load', async (req, res) => {
  try {
    const { configPath } = req.body;

    if (!configPath) {
      return res.status(400).json({ 
        error: 'Missing configPath' 
      });
    }

    // Read XML file
    const xmlContent = fs.readFileSync(configPath, 'utf8');
    
    // Parse XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);

    // Extract servers
    const servers = [];
    if (result.Objs && result.Objs.Obj) {
      const objs = Array.isArray(result.Objs.Obj) ? result.Objs.Obj : [result.Objs.Obj];
      
      objs.forEach(obj => {
        if (obj.Props && obj.Props[0] && obj.Props[0].Obj) {
          const propsObjs = Array.isArray(obj.Props[0].Obj) ? obj.Props[0].Obj : [obj.Props[0].Obj];
          
          propsObjs.forEach(serverObj => {
            const server = {};
            if (serverObj.Props && serverObj.Props[0] && serverObj.Props[0].S) {
              serverObj.Props[0].S.forEach(prop => {
                if (prop.$ && prop.$.N) {
                  server[prop.$.N] = prop._;
                }
              });
            }
            
            if (server.Name && (server.ReportServerUrl || server.ReportServerUri)) {
              servers.push({
                name: server.Name,
                serverUri: server.ReportServerUrl || server.ReportServerUri
              });
            }
          });
        }
      });
    }

    res.json({
      success: true,
      servers: servers
    });

  } catch (error) {
    console.error('Error loading config:', error);
    res.status(500).json({ 
      error: 'Failed to load configuration', 
      message: error.message 
    });
  }
});

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

