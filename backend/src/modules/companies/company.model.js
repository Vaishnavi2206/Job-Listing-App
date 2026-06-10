const { DataTypes } = require("sequelize");

const sequelize = require("../../config/db");

const Company = sequelize.define(
  "Company",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
    },

    employeeSize: {
      type: DataTypes.STRING,
    },

    location: {
      type: DataTypes.STRING,
    },

    category: {
      type: DataTypes.STRING,
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "companies",
    timestamps: true,
  }
);

module.exports = Company;