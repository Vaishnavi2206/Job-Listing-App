const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");

const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} = require("./posts.controller");

const router = express.Router();

router.get("/", getAllPosts);

router.get("/:id", getPostById);

router.post("/", authMiddleware, createPost);

router.patch("/:id", authMiddleware, updatePost);

router.delete("/:id", authMiddleware, deletePost);

module.exports = router;
