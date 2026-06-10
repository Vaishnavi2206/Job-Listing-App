const express = require("express");

const authMiddleware = require(
  "../../middleware/auth.middleware"
);

const employerOnly = require(
  "../../middleware/employerOnly.middleware"
);

const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require("./jobListing.controller");

const router = express.Router();

router.get("/", getAllJobs);

router.get("/:id", getJobById);

router.post(
  "/",
  authMiddleware,
  employerOnly,
  createJob
);

router.patch(
  "/:id",
  authMiddleware,
  employerOnly,
  updateJob
);

router.delete(
  "/:id",
  authMiddleware,
  employerOnly,
  deleteJob
);

module.exports = router;