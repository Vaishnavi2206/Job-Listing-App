"use strict";

const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  BadGatewayError,
} = require("../errors");

describe("error classes", () => {
  it("should construct base AppError", () => {
    const err = new AppError("Base", 499);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Base");
    expect(err.statusCode).toBe(499);
    expect(err.isOperational).toBe(true);
  });

  it("should create BadRequestError with default status/message", () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Bad Request");
  });

  it("should create UnauthorizedError with default status/message", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("should create ForbiddenError with default status/message", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Forbidden");
  });

  it("should create NotFoundError with default status/message", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not Found");
  });

  it("should create ConflictError with default status/message", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe("Conflict");
  });

  it("should create UnprocessableEntityError with default status/message", () => {
    const err = new UnprocessableEntityError();
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Unprocessable Entity");
  });

  it("should create BadGatewayError with default status/message", () => {
    const err = new BadGatewayError();
    expect(err.statusCode).toBe(502);
    expect(err.message).toBe("Bad Gateway");
  });
});
