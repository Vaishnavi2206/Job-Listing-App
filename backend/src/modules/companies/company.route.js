const express = require("express");

const authMiddleware = require(
  "../../middleware/auth.middleware"
);

const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require("./company.controller");

const router = express.Router();

/*
  Public Routes
*/

router.get("/", getAllCompanies);

router.get("/:id", getCompanyById);

/*
  Protected Routes
*/

router.post(
  "/",
  authMiddleware,
  createCompany
);

router.patch(
  "/:id",
  authMiddleware,
  updateCompany
);

router.delete(
  "/:id",
  authMiddleware,
  deleteCompany
);

module.exports = router;