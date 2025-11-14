const express = require('express');
const reportController = require('../controllers/reportController');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validationMiddleware');
const reportValidation = require('../validations/reportValidation');

const router = express.Router();

router.post(
  '/list',
  validate(reportValidation.listReports),
  asyncHandler(reportController.listReports)
);

router.post(
  '/rename',
  validate(reportValidation.renameItem),
  asyncHandler(reportController.renameItem)
);

module.exports = router;

