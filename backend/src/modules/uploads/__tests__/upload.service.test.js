"use strict";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");
jest.mock("crypto");
jest.mock("../../../models", () => ({}));

const { S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const { createSignedUploadUrl } = require("../upload.service");
const { BadRequestError } = require("../../../shared/utils/errors");

const USER_ID = 1;

beforeEach(() => {
  jest.resetAllMocks();
  // S3Client is instantiated at module load; mock its send method via prototype
  S3Client.prototype.send = jest.fn();
  crypto.randomUUID = jest.fn().mockReturnValue("uuid-1234");
  process.env.SUPABASE_STORAGE_BUCKET = "test-bucket";
  process.env.SUPABASE_S3_ENDPOINT = "https://storage.example.com";
});

// ─── createSignedUploadUrl ────────────────────────────────────────────────────

describe("createSignedUploadUrl", () => {
  it("should return signedUrl, path, and expiresIn on happy path", async () => {
    getSignedUrl.mockResolvedValue("https://signed.example.com/upload");

    const result = await createSignedUploadUrl(
      { filename: "photo.jpg", mimeType: "image/jpeg", folder: "posts" },
      USER_ID
    );

    expect(getSignedUrl).toHaveBeenCalled();
    expect(result.signedUrl).toBe("https://signed.example.com/upload");
    expect(result.path).toMatch(/^posts\/1\//);
    expect(result.path).toMatch(/\.jpg$/);
    expect(result.expiresIn).toBe(300);
  });

  it("should derive extension from MIME type map when known", async () => {
    getSignedUrl.mockResolvedValue("https://signed.example.com/upload");

    const result = await createSignedUploadUrl(
      { filename: "clip.mp4", mimeType: "video/mp4", folder: "posts" },
      USER_ID
    );

    expect(result.path).toMatch(/\.mp4$/);
  });

  it("should fall back to filename extension when MIME type is not in the map", async () => {
    getSignedUrl.mockResolvedValue("https://signed.example.com/upload");

    const result = await createSignedUploadUrl(
      { filename: "resume.pdf", mimeType: "application/pdf", folder: "posts" },
      USER_ID
    );

    expect(result.path).toMatch(/\.pdf$/);
  });

  it("should include userId in the generated path", async () => {
    getSignedUrl.mockResolvedValue("https://signed.example.com/upload");

    const result = await createSignedUploadUrl(
      { filename: "img.png", mimeType: "image/png", folder: "avatars" },
      42
    );

    expect(result.path).toContain("/42/");
  });

  it("should include the folder in the generated path", async () => {
    getSignedUrl.mockResolvedValue("https://signed.example.com/upload");

    const result = await createSignedUploadUrl(
      { filename: "img.png", mimeType: "image/png", folder: "avatars" },
      USER_ID
    );

    expect(result.path).toMatch(/^avatars\//);
  });

  it("should throw BadRequestError when getSignedUrl rejects", async () => {
    getSignedUrl.mockRejectedValue(new Error("S3 unreachable"));

    await expect(
      createSignedUploadUrl({ filename: "img.png", mimeType: "image/png", folder: "posts" }, USER_ID)
    ).rejects.toThrow(BadRequestError);
    await expect(
      createSignedUploadUrl({ filename: "img.png", mimeType: "image/png", folder: "posts" }, USER_ID)
    ).rejects.toThrow("Could not generate upload URL");
  });

  it("should keep generated path even when unknown mime and empty filename are provided", async () => {
    getSignedUrl.mockResolvedValue("https://signed.example.com/upload");

    const result = await createSignedUploadUrl(
      { filename: "", mimeType: "application/x-unknown", folder: "posts" },
      USER_ID
    );

    expect(result.path).toMatch(/\.$/);
  });
});
