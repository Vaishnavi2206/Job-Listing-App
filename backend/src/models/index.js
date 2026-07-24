const User = require("../modules/users/user.model");

const Role = require("../modules/roles/role.model");

const Company = require("../modules/companies/company.model");
const JobListing = require("../modules/jobListings/jobListing.model");

const Application = require("../modules/applications/application.model");

Role.hasMany(User, {
  foreignKey: "roleId",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
});

/*
  User ↔ Company
*/

User.hasMany(Company, {
  foreignKey: "createdBy",
});

Company.belongsTo(User, {
  foreignKey: "createdBy",
});

Company.hasMany(JobListing, {
  foreignKey: "companyId",
});

JobListing.belongsTo(Company, {
  foreignKey: "companyId",
});

User.hasMany(Application, {
  foreignKey: "candidateId",
});

Application.belongsTo(User, {
  foreignKey: "candidateId",
});

Company.hasMany(Application, {
  foreignKey: "companyId",
});

Application.belongsTo(Company, {
  foreignKey: "companyId",
});

JobListing.hasMany(Application, {
  foreignKey: "jobListingId",
});

Application.belongsTo(JobListing, {
  foreignKey: "jobListingId",
});

module.exports = {
  User,
  Role,
  Company,
  JobListing,
  Application,
};
