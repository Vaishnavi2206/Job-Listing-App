const { DataTypes } = require("sequelize");

const sequelize = require("../../config/db");

const JobListing = sequelize.define(
  "JobListing",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING,
    },

    salaryMin: {
      type: DataTypes.INTEGER,
    },

    salaryMax: {
      type: DataTypes.INTEGER,
    },

    employmentType: {
      type: DataTypes.STRING,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    },
    searchVector: {
      type: DataTypes.TSVECTOR,
      field: "search_vector",
    },
  },
  {
    tableName: "job_listings",
    timestamps: true,
  }
);

module.exports = JobListing;