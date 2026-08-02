const asyncHandler = require("../../shared/utils/asyncHandler");

const { createPostSchema, updatePostSchema } = require("./posts.validation");

const postService = require("./posts.service");

const createPost = asyncHandler(async (req, res) => {
  const validatedData = createPostSchema.parse(req.body);

  const post = await postService.createPost(validatedData);

  res.status(201).json({
    success: true,
    data: post,
  });
});

const getAllPosts = asyncHandler(async (req, res) => {
  const { limit, cursor, search } = req.query;
  const postsResponse = await postService.getAllPosts({
    limit,
    cursor,
    search,
  });

  res.json({
    success: true,
    data: postsResponse,
  });
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.id);

  res.json({
    success: true,
    data: post,
  });
});

const updatePost = asyncHandler(async (req, res) => {
  const validatedData = updatePostSchema.parse(req.body);

  const post = await postService.updatePost(req.params.id, validatedData, req.user.userId);

  res.json({
    success: true,
    data: post,
  });
});

const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(req.params.id, req.query.softDelete, req.user.userId);

  res.json({
    success: true,
    message: "Post deleted successfully",
  });
});

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
