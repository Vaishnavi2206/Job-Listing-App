const { z } = require("zod");
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

// Exhaustive list of allowed MIME types — images and videos only.
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  // Videos
  "video/mp4",
  "video/quicktime",  // .mov
  "video/webm",
  "video/x-msvideo",  // .avi
  "video/x-matroska", // .mkv
  "video/3gpp",
]);

const signedUrlSchema = z.object({
  /** Original filename supplied by the client (used only to derive an extension fallback). */
  filename: z.string().min(1).max(255),

  /** IANA media type sent by the browser. Must be an allowed image or video type. */
  mimeType: z.string().refine((v) => ALLOWED_MIME_TYPES.has(v), {
    message: "Only image and video files are allowed.",
  }),

  /** File size in bytes (must be <= 50MB). */
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, "File size must be 50MB or less."),

  /**
   * Storage sub-folder. Defaults to "posts".
   * Restricted to alphanumeric chars + hyphens/underscores to prevent path traversal.
   */
  folder: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid folder name.")
    .max(50)
    .default("posts"),
});

module.exports = { signedUrlSchema, ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES };
