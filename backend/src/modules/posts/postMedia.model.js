const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const PostMedia = sequelize.define(
  "PostMedia",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "posts",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    // Publicly accessible URL (CDN / object storage)
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // IANA media type, e.g. "image/jpeg", "video/mp4"
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Convenience discriminator derived from mimeType
    mediaType: {
      type: DataTypes.ENUM("image", "video"),
      allowNull: false,
    },

    // Original filename supplied by the client
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // File size in bytes (optional — populated when available)
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Image dimensions (null for video)
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Video duration in seconds (null for images)
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    // Controls display order within a post (0-indexed)
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "post_media",
    timestamps: true,
    underscored: true,
    indexes: [
      // Fast lookup of all media for a given post, in order
      { fields: ["post_id", "display_order"] },
    ],
  }
);

module.exports = PostMedia;
