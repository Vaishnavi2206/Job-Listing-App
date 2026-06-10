const { DataTypes } = require("sequelize");

const sequelize = require("../../config/db");

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    candidateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    },

    jobListingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "job_listings",
        key: "id",
      },
    },

    resumeUrl: {
      type: DataTypes.TEXT,
    },

    coverLetter: {
      type: DataTypes.TEXT,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  },
  {
    tableName: "applications",
    timestamps: true,
  }
);

module.exports = Application;
