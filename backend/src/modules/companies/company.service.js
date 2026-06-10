const Company = require("./company.model");

const createCompany = async (payload, userId) => {
  const company = await Company.create({
    ...payload,
    createdBy: userId,
  });

  return company;
};

const getAllCompanies = async () => {
  return await Company.findAll();
};

const getCompanyById = async (id) => {
  return await Company.findByPk(id);
};

const updateCompany = async (
  companyId,
  payload,
  userId
) => {
  const company = await Company.findByPk(companyId);

  if (!company) {
    throw new Error("Company not found");
  }

  /*
    Ownership validation
  */

  if (company.createdBy !== userId) {
    throw new Error(
      "You are not allowed to update this company"
    );
  }

  await company.update(payload);

  return company;
};

const deleteCompany = async (
  companyId,
  userId
) => {
  const company = await Company.findByPk(companyId);

  if (!company) {
    throw new Error("Company not found");
  }

  if (company.createdBy !== userId) {
    throw new Error(
      "You are not allowed to delete this company"
    );
  }

  await company.destroy();

  return true;
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};