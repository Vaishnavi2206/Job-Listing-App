const express = require("express");

const authMiddleware = require(
  "../../middleware/auth.middleware"
);

const employerOnly = require(
  "../../middleware/employerOnly.middleware"
);

const candidateOnly = require(
  "../../middleware/candidateOnly.middleware"
);

const {
  createApplication,
  getMyApplications,
  getCompanyApplications,
  getJobApplications,
  updateApplicationStatus,
} = require("./application.controller");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  candidateOnly,
  createApplication
);

router.get(
  "/me",
  authMiddleware,
  candidateOnly,
  getMyApplications
);

router.get(
  "/company/:companyId",
  authMiddleware,
  employerOnly,
  getCompanyApplications
);

router.get(
  "/job/:jobId",
  authMiddleware,
  employerOnly,
  getJobApplications
);

router.patch(
  "/:id/status",
  authMiddleware,
  employerOnly,
  updateApplicationStatus
);

module.exports = router;