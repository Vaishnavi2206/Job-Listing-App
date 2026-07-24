const asyncHandler = require("../../shared/utils/asyncHandler");

const { createCompanySchema, updateCompanySchema } = require("./company.validation");

const companyService = require("./company.service");

const createCompany = asyncHandler(async (req, res) => {
  const validatedData = createCompanySchema.parse(req.body);

  const company = await companyService.createCompany(validatedData, req.user.userId);

  res.status(201).json({
    success: true,
    data: company,
  });
});

const getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await companyService.getAllCompanies();

  res.json({
    success: true,
    data: companies,
  });
});

const getCompanyById = asyncHandler(async (req, res) => {
  const company = await companyService.getCompanyById(req.params.id);

  res.json({
    success: true,
    data: company,
  });
});

const updateCompany = asyncHandler(async (req, res) => {
  const validatedData = updateCompanySchema.parse(req.body);

  const company = await companyService.updateCompany(req.params.id, validatedData, req.user.userId);

  res.json({
    success: true,
    data: company,
  });
});

const deleteCompany = asyncHandler(async (req, res) => {
  await companyService.deleteCompany(req.params.id, req.user.userId);

  res.json({
    success: true,
    message: "Company deleted successfully",
  });
});

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
