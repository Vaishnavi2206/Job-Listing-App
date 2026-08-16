"use strict";

jest.mock("../posts.service");
jest.mock("../../../models", () => ({}));
jest.mock("../../../middleware/auth.middleware", () => (req, res, next) => {
  req.user = { userId: 3, roleName: "EMPLOYER" };
  next();
});

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const postService = require("../posts.service");
const postRouter = require("../posts.route");
const errorMiddleware = require("../../../middleware/error.middleware");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/posts", postRouter);
  app.use(errorMiddleware);
  return app;
};

let app;
beforeAll(() => { app = buildApp(); });
beforeEach(() => { jest.resetAllMocks(); });

const POST_ID = "post-1";
const AUTHOR_ID = "550e8400-e29b-41d4-a716-446655440002";
const mockPost = { id: POST_ID, title: "Hello World", description: "A great post about coding" };
const paginatedResponse = { posts: [mockPost], pagination: { hasMore: false, nextCursor: null } };

// ─── GET /api/posts ───────────────────────────────────────────────────────────

describe("GET /api/posts", () => {
  it("should return 200 with paginated posts", async () => {
    postService.getAllPosts.mockResolvedValue(paginatedResponse);

    const res = await request(app).get("/api/posts");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: paginatedResponse });
    expect(postService.getAllPosts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: undefined, cursor: undefined })
    );
  });

  it("should pass query params to the service", async () => {
    postService.getAllPosts.mockResolvedValue(paginatedResponse);

    await request(app).get("/api/posts?limit=5&cursor=tok");

    expect(postService.getAllPosts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: "5", cursor: "tok" })
    );
  });
});

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────

describe("GET /api/posts/:id", () => {
  it("should return 200 with the post", async () => {
    postService.getPostById.mockResolvedValue(mockPost);

    const res = await request(app).get(`/api/posts/${POST_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: POST_ID });
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    postService.getPostById.mockRejectedValue(new NotFoundError("Post not found"));

    const res = await request(app).get("/api/posts/missing");

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────

describe("POST /api/posts", () => {
  const validBody = {
    title: "Hello World Post",
    description: "A long enough description here",
    authorId: AUTHOR_ID,
  };

  it("should return 201 with the created post", async () => {
    postService.createPost.mockResolvedValue(mockPost);

    const res = await request(app).post("/api/posts").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, data: mockPost });
    expect(postService.createPost).toHaveBeenCalledWith(expect.objectContaining({ title: validBody.title }));
  });

  it("should return 422 when title is too short (< 5 chars)", async () => {
    const res = await request(app).post("/api/posts").send({ ...validBody, title: "Hi" });

    expect(res.status).toBe(422);
    expect(postService.createPost).not.toHaveBeenCalled();
  });

  it("should return 422 when description is too short (< 10 chars)", async () => {
    const res = await request(app).post("/api/posts").send({ ...validBody, description: "Short" });

    expect(res.status).toBe(422);
  });

  it("should return 422 when authorId is not a valid UUID", async () => {
    const res = await request(app).post("/api/posts").send({ ...validBody, authorId: "bad-id" });

    expect(res.status).toBe(422);
  });

  it("should return 422 when mediaItems array exceeds 10 items", async () => {
    const mediaItem = { url: "key.jpg", mimeType: "image/jpeg", mediaType: "image", filename: "key.jpg" };
    const res = await request(app)
      .post("/api/posts")
      .send({ ...validBody, mediaItems: Array(11).fill(mediaItem) });

    expect(res.status).toBe(422);
  });
});

// ─── PATCH /api/posts/:id ─────────────────────────────────────────────────────

describe("PATCH /api/posts/:id", () => {
  it("should return 200 with updated post", async () => {
    const updated = { ...mockPost, title: "Updated Title Here" };
    postService.updatePost.mockResolvedValue(updated);

    const res = await request(app).patch(`/api/posts/${POST_ID}`).send({ title: "Updated Title Here" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated Title Here");
    expect(postService.updatePost).toHaveBeenCalledWith(POST_ID, expect.any(Object), 3);
  });

  it("should return 403 when service throws ForbiddenError", async () => {
    const { ForbiddenError } = require("../../../shared/utils/errors");
    postService.updatePost.mockRejectedValue(new ForbiddenError("Not allowed"));

    const res = await request(app).patch(`/api/posts/${POST_ID}`).send({ title: "Updated Title Here" });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────

describe("DELETE /api/posts/:id", () => {
  it("should return 200 on hard delete", async () => {
    postService.deletePost.mockResolvedValue(true);

    const res = await request(app).delete(`/api/posts/${POST_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: "Post deleted successfully" });
    expect(postService.deletePost).toHaveBeenCalledWith(POST_ID, undefined, 3);
  });

  it("should pass softDelete query param to the service", async () => {
    postService.deletePost.mockResolvedValue(true);

    await request(app).delete(`/api/posts/${POST_ID}?softDelete=true`);

    expect(postService.deletePost).toHaveBeenCalledWith(POST_ID, "true", 3);
  });

  it("should return 404 when service throws NotFoundError", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    postService.deletePost.mockRejectedValue(new NotFoundError("Post not found"));

    const res = await request(app).delete(`/api/posts/${POST_ID}`);

    expect(res.status).toBe(404);
  });
});
