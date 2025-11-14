const express = require('express');
const adController = require('../controllers/adController');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validationMiddleware');
const adValidation = require('../validations/adValidation');

const router = express.Router();

router.post(
  '/search',
  validate(adValidation.search),
  asyncHandler(adController.search)
);

router.post(
  '/user/details',
  validate(adValidation.userDetails),
  asyncHandler(adController.getUserDetails)
);

router.post(
  '/group/members',
  validate(adValidation.groupMembers),
  asyncHandler(adController.getGroupMembers)
);

router.post(
  '/user/direct-reports',
  validate(adValidation.directReports),
  asyncHandler(adController.getDirectReports)
);

router.post(
  '/user/manager-chain',
  validate(adValidation.managerChain),
  asyncHandler(adController.getManagerChain)
);

router.post(
  '/search/department',
  validate(adValidation.departmentSearch),
  asyncHandler(adController.searchByDepartment)
);

router.post(
  '/departments',
  validate(adValidation.simpleConfig),
  asyncHandler(adController.getDepartments)
);

router.post(
  '/locations',
  validate(adValidation.simpleConfig),
  asyncHandler(adController.getLocations)
);

module.exports = router;

