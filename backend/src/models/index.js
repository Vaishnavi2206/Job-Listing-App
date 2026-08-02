const User = require("../modules/users/user.model");

const Role = require("../modules/roles/role.model");

const Company = require("../modules/companies/company.model");
const JobListing = require("../modules/jobListings/jobListing.model");

const Application = require("../modules/applications/application.model");
const Post = require("../modules/posts/posts.model");
const PostMedia = require("../modules/posts/postMedia.model");


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

User.hasMany(Post, {
  foreignKey: "authorId",
});

Post.belongsTo(User, {
  foreignKey: "authorId",
});

/*
  Post ↔ PostMedia  (one-to-many)
*/

Post.hasMany(PostMedia, {
  foreignKey: "postId",
  as: "media",
  onDelete: "CASCADE",
});

PostMedia.belongsTo(Post, {
  foreignKey: "postId",
});

module.exports = {
  User,
  Role,
  Company,
  JobListing,
  Application,
  Post,
  PostMedia,
};
