const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const { getSignedUploadUrl } = require("./upload.controller");

const router = express.Router();

/**
 * POST /api/uploads/signed-url
 *
 * Generates a short-lived Supabase signed upload URL so the client can PUT
 * a file directly to object storage without routing bytes through this server.
 *
 * Requires a valid JWT (authMiddleware).
 */
router.post("/signed-url", authMiddleware, getSignedUploadUrl);

module.exports = router;
