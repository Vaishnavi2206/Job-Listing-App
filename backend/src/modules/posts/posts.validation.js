const { z } = require("zod");

const postMediaSchema = z.object({
  // Stored media reference (private bucket object key/path or URL from legacy records)
  url: z.string().min(1),
  mimeType: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  filename: z.string().min(1),
  size: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const createPostSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  authorId: z.string().uuid(),
  mediaItems: z.array(postMediaSchema).max(10).optional(),
});

const updatePostSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
});

module.exports = {
  postMediaSchema,
  createPostSchema,
  updatePostSchema,
};
