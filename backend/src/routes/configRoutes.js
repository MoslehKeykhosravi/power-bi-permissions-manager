const express = require('express');
const configController = require('../controllers/configController');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

router.get(
  '/servers',
  asyncHandler(configController.getServers)
);

module.exports = router;

