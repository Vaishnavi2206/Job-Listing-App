import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "../api/axios";
import { MAX_UPLOAD_BYTES, uploadPostMedia } from "./uploads.service";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("uploads.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload image media and return mapped metadata", async () => {
    const file = new File(["content"], "photo.png", { type: "image/png" });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          signedUrl: "https://signed-upload-url",
          path: "posts/1/photo.png",
          expiresIn: 300,
        },
      },
    } as any);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, status: 200 } as Response);

    const result = await uploadPostMedia(file);

    expect(api.post).toHaveBeenCalledWith("/uploads/signed-url", {
      filename: "photo.png",
      mimeType: "image/png",
      fileSize: file.size,
      folder: "posts",
    });
    expect(fetchSpy).toHaveBeenCalledWith("https://signed-upload-url", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: file,
    });
    expect(result).toEqual({
      url: "posts/1/photo.png",
      mimeType: "image/png",
      mediaType: "image",
      filename: "photo.png",
      size: file.size,
    });
  });

  it("should map video file to mediaType=video", async () => {
    const file = new File(["video-data"], "clip.mp4", { type: "video/mp4" });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          signedUrl: "https://signed-upload-url",
          path: "posts/1/clip.mp4",
          expiresIn: 300,
        },
      },
    } as any);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);

    const result = await uploadPostMedia(file);

    expect(result.mediaType).toBe("video");
  });

  it("should throw when file exceeds upload limit", async () => {
    const bigFile = {
      name: "big.bin",
      size: MAX_UPLOAD_BYTES + 1,
      type: "application/octet-stream",
    } as File;

    await expect(uploadPostMedia(bigFile)).rejects.toThrow('File "big.bin" exceeds 50MB limit.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it("should throw when upload request returns non-ok response", async () => {
    const file = new File(["content"], "photo.png", { type: "image/png" });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          signedUrl: "https://signed-upload-url",
          path: "posts/1/photo.png",
          expiresIn: 300,
        },
      },
    } as any);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(uploadPostMedia(file)).rejects.toThrow("Upload failed with status 500");
  });

  it("should throw when backend response path is missing", async () => {
    const file = new File(["content"], "photo.png", { type: "image/png" });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          signedUrl: "https://signed-upload-url",
          path: "   ",
          expiresIn: 300,
        },
      },
    } as any);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);

    await expect(uploadPostMedia(file)).rejects.toThrow("Upload response is missing media path.");
  });
});
