const { ZodError } = require("zod");
const { AppError } = require("../shared/utils/errors");

const errorMiddleware = (err, req, res, _next) => {
  // Zod validation errors → 422 with per-field detail
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // Typed operational errors (NotFoundError, ForbiddenError, etc.)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Sequelize unique constraint → 409
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
    });
  }

  // Sequelize model validation → 422
  if (err.name === "SequelizeValidationError") {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // JWT errors → 401
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Unhandled / programmer errors → 500
  console.error(err);

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};

module.exports = errorMiddleware;
