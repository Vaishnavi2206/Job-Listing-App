const crypto = require("crypto");
const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { BadRequestError } = require("../../shared/utils/errors");

// ── MIME → file extension map ────────────────────────────────

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
  "video/3gpp": "3gp",
};

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "posts";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

/**
 * Generates an S3-compatible presigned upload URL for Supabase Storage.
 */
const createSignedUploadUrl = async (
  { filename, mimeType, folder },
  userId
) => {
  try {
    const ext =
      MIME_TO_EXT[mimeType] ??
      filename.split(".").pop() ??
      "bin";

    const key = `${folder}/${userId}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const expiresIn = 300;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn,
    });

    return {
      signedUrl,
      path: key,
      expiresIn,
    };
  } catch (err) {
    throw new BadRequestError(
      `Could not generate upload URL: ${err.message}`
    );
  }
};

module.exports = {
  createSignedUploadUrl,
};
