const { DataTypes } = require("sequelize");

const sequelize = require("../../config/db");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "roles",
    timestamps: true,
  }
);

module.exports = Role;