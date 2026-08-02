const asyncHandler = require("../../shared/utils/asyncHandler");
const { signedUrlSchema } = require("./upload.validation");
const uploadService = require("./upload.service");

/**
 * POST /api/uploads/signed-url
 *
 * Request body:
 *   { filename: string, mimeType: string, folder?: string }
 *
 * Response:
 *   { signedUrl: string, path: string, publicUrl: string, expiresIn: number }
 */
const getSignedUploadUrl = asyncHandler(async (req, res) => {
  const validatedData = signedUrlSchema.parse(req.body);

  const result = await uploadService.createSignedUploadUrl(
    validatedData,
    req.user.userId
  );

  res.json({
    success: true,
    data: result,
  });
});

module.exports = { getSignedUploadUrl };
