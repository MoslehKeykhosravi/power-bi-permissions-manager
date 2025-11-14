const express = require('express');
const permissionController = require('../controllers/permissionController');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validationMiddleware');
const permissionValidation = require('../validations/permissionValidation');

const router = express.Router();

router.post(
  '/get',
  validate(permissionValidation.getPermissions),
  asyncHandler(permissionController.getPermissions)
);

router.post(
  '/check',
  validate(permissionValidation.checkPermissions),
  asyncHandler(permissionController.checkPermissions)
);

router.post(
  '/set',
  validate(permissionValidation.setPermissions),
  asyncHandler(permissionController.setPermissions)
);

module.exports = router;

