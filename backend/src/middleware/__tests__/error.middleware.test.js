"use strict";

const { ZodError } = require("zod");
const errorMiddleware = require("../error.middleware");
const { AppError } = require("../../shared/utils/errors");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("error.middleware", () => {
  it("should return 422 for ZodError", () => {
    const err = new ZodError([
      { path: ["email"], message: "Invalid email", code: "custom" },
    ]);
    const res = createRes();

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Validation failed" })
    );
  });

  it("should return AppError status and message", () => {
    const err = new AppError("No access", 403);
    const res = createRes();

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "No access" });
  });

  it("should return 409 for SequelizeUniqueConstraintError", () => {
    const err = { name: "SequelizeUniqueConstraintError" };
    const res = createRes();

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("should return 422 with mapped errors for SequelizeValidationError", () => {
    const err = {
      name: "SequelizeValidationError",
      errors: [{ path: "title", message: "Required" }],
    };
    const res = createRes();

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [{ field: "title", message: "Required" }],
      })
    );
  });

  it("should return 401 for JsonWebTokenError", () => {
    const err = { name: "JsonWebTokenError" };
    const res = createRes();

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid token" });
  });

  it("should return 401 for TokenExpiredError", () => {
    const err = { name: "TokenExpiredError" };
    const res = createRes();

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Token expired" });
  });

  it("should return 500 with detailed message in non-production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const err = new Error("boom");
    const res = createRes();
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "boom" });

    spy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should return generic 500 message in production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const err = new Error("sensitive");
    const res = createRes();
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    errorMiddleware(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Internal server error" });

    spy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });
});
