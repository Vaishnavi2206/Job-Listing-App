"use strict";

jest.mock("../upload.service");
jest.mock("../../../models", () => ({}));
jest.mock("../../../middleware/auth.middleware", () => (req, res, next) => {
  req.user = { userId: 1, roleName: "EMPLOYER" };
  next();
});

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const uploadService = require("../upload.service");
const uploadRouter = require("../upload.route");
const errorMiddleware = require("../../../middleware/error.middleware");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/uploads", uploadRouter);
  app.use(errorMiddleware);
  return app;
};

let app;
beforeAll(() => { app = buildApp(); });
beforeEach(() => { jest.resetAllMocks(); });

const validBody = {
  filename: "photo.jpg",
  mimeType: "image/jpeg",
  fileSize: 1024 * 1024, // 1 MB
  folder: "posts",
};

const serviceResult = {
  signedUrl: "https://signed.example.com/upload",
  path: "posts/1/timestamp_uuid.jpg",
  expiresIn: 300,
};

// ─── POST /api/uploads/signed-url ─────────────────────────────────────────────

describe("POST /api/uploads/signed-url", () => {
  it("should return 200 with signedUrl, path, and expiresIn on success", async () => {
    uploadService.createSignedUploadUrl.mockResolvedValue(serviceResult);

    const res = await request(app).post("/api/uploads/signed-url").send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: serviceResult });
    expect(uploadService.createSignedUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "photo.jpg", mimeType: "image/jpeg" }),
      1
    );
  });

  it("should return 422 when filename is missing", async () => {
    const { filename: _, ...body } = validBody;
    const res = await request(app).post("/api/uploads/signed-url").send(body);

    expect(res.status).toBe(422);
    expect(uploadService.createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("should return 422 when mimeType is not allowed", async () => {
    const res = await request(app)
      .post("/api/uploads/signed-url")
      .send({ ...validBody, mimeType: "application/pdf" });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "mimeType" })])
    );
  });

  it("should return 422 when fileSize exceeds 50MB", async () => {
    const res = await request(app)
      .post("/api/uploads/signed-url")
      .send({ ...validBody, fileSize: 51 * 1024 * 1024 });

    expect(res.status).toBe(422);
  });

  it("should return 422 when fileSize is zero or negative", async () => {
    const res = await request(app)
      .post("/api/uploads/signed-url")
      .send({ ...validBody, fileSize: 0 });

    expect(res.status).toBe(422);
  });

  it("should return 422 when folder contains path traversal characters", async () => {
    const res = await request(app)
      .post("/api/uploads/signed-url")
      .send({ ...validBody, folder: "../etc/passwd" });

    expect(res.status).toBe(422);
  });

  it("should default folder to 'posts' when not provided", async () => {
    uploadService.createSignedUploadUrl.mockResolvedValue(serviceResult);
    const { folder: _, ...bodyWithoutFolder } = validBody;

    await request(app).post("/api/uploads/signed-url").send(bodyWithoutFolder);

    expect(uploadService.createSignedUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({ folder: "posts" }),
      1
    );
  });

  it("should return 400 when service throws BadRequestError (S3 failure)", async () => {
    const { BadRequestError } = require("../../../shared/utils/errors");
    uploadService.createSignedUploadUrl.mockRejectedValue(
      new BadRequestError("Could not generate upload URL: S3 unreachable")
    );

    const res = await request(app).post("/api/uploads/signed-url").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch("Could not generate upload URL");
  });
});
