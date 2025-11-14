const express = require('express');
const reportRoutes = require('./reportRoutes');
const permissionRoutes = require('./permissionRoutes');
const adRoutes = require('./adRoutes');
const configRoutes = require('./configRoutes');

const router = express.Router();

router.use('/reports', reportRoutes);
router.use('/permissions', permissionRoutes);
router.use('/ad', adRoutes);
router.use('/config', configRoutes);

module.exports = router;

