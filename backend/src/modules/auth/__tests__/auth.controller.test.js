"use strict";

// Mock the service before any require() that might pull it in
jest.mock("../auth.service");
// Prevent the models barrel from opening a real DB connection
jest.mock("../../../models", () => ({}));

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const authService = require("../auth.service");
const authRouter = require("../auth.route");
const errorMiddleware = require("../../../middleware/error.middleware");

// Minimal app — mirrors how app.js mounts the router
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use(errorMiddleware);
  return app;
};

let app;
beforeAll(() => {
  app = buildApp();
});

beforeEach(() => {
  jest.resetAllMocks();
  process.env.NODE_ENV = "test";
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  const validBody = {
    firstName: "Jane",
    lastName: "Doe",
    username: "jane@example.com",
    password: "password123",
    roleName: "candidate",
  };

  it("should return 201 with user data on success", async () => {
    const serviceResult = { id: 1, firstName: "Jane", lastName: "Doe", username: "jane@example.com", roleName: "candidate" };
    authService.signup.mockResolvedValue(serviceResult);

    const res = await request(app).post("/api/auth/signup").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: "User registered successfully", data: serviceResult });
    expect(authService.signup).toHaveBeenCalledTimes(1);
    expect(authService.signup).toHaveBeenCalledWith(expect.objectContaining({ username: validBody.username }));
  });

  it("should return 422 when required fields are missing", async () => {
    const res = await request(app).post("/api/auth/signup").send({ username: "jane@example.com" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(authService.signup).not.toHaveBeenCalled();
  });

  it("should return 422 when username is not a valid email", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...validBody, username: "not-an-email" });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "username" })])
    );
  });

  it("should return 422 when firstName is shorter than 2 characters", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...validBody, firstName: "J" });

    expect(res.status).toBe(422);
  });

  it("should return 409 when service throws ConflictError", async () => {
    const { ConflictError } = require("../../../shared/utils/errors");
    authService.signup.mockRejectedValue(new ConflictError("Username already exists"));

    const res = await request(app).post("/api/auth/signup").send(validBody);

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, message: "Username already exists" });
  });

  it("should return 400 when service throws BadRequestError", async () => {
    const { BadRequestError } = require("../../../shared/utils/errors");
    authService.signup.mockRejectedValue(new BadRequestError("Invalid role"));

    const res = await request(app).post("/api/auth/signup").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, message: "Invalid role" });
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  const validBody = { username: "jane@example.com", password: "password123" };
  const serviceResult = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: { id: 1, firstName: "Jane", lastName: "Doe", username: "jane@example.com", roleName: "candidate" },
  };

  it("should return 200 with accessToken and set refreshToken cookie on success", async () => {
    authService.login.mockResolvedValue(serviceResult);

    const res = await request(app).post("/api/auth/login").send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: "Login successful", accessToken: "access-token" });
    expect(res.body.user).toMatchObject({ id: 1, roleName: "candidate" });

    const cookies = res.headers["set-cookie"] ?? [];
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
    expect(authService.login).toHaveBeenCalledWith({ username: validBody.username, password: validBody.password });
  });

  it("should not expose refreshToken in the response body", async () => {
    authService.login.mockResolvedValue(serviceResult);

    const res = await request(app).post("/api/auth/login").send(validBody);

    expect(res.body.refreshToken).toBeUndefined();
  });

  it("should return 422 when username is not a valid email", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "bad", password: "pw" });

    expect(res.status).toBe(422);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("should return 422 when body is empty", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(422);
  });

  it("should return 401 when service throws UnauthorizedError", async () => {
    const { UnauthorizedError } = require("../../../shared/utils/errors");
    authService.login.mockRejectedValue(new UnauthorizedError("Invalid credentials"));

    const res = await request(app).post("/api/auth/login").send(validBody);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, message: "Invalid credentials" });
  });

  it("should set secure refresh cookie in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.REFRESH_COOKIE_MAX_AGE_DAYS = "2";
    authService.login.mockResolvedValue(serviceResult);

    const res = await request(app).post("/api/auth/login").send(validBody);

    const cookies = res.headers["set-cookie"] ?? [];
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("Secure");
    expect(refreshCookie).toContain("Max-Age=172800");
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe("POST /api/auth/refresh", () => {
  const serviceResult = {
    accessToken: "new-access-token",
    refreshToken: "new-refresh-token",
    user: { id: 1, firstName: "Jane", lastName: "Doe", username: "jane@example.com", roleName: "candidate" },
  };

  it("should return 200 with new accessToken and rotate refreshToken cookie", async () => {
    authService.refreshSession.mockResolvedValue(serviceResult);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=old-refresh-token");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: "Session refreshed", accessToken: "new-access-token" });
    expect(authService.refreshSession).toHaveBeenCalledWith("old-refresh-token");

    const cookies = res.headers["set-cookie"] ?? [];
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("should return 401 and clear cookie when refreshToken cookie is absent", async () => {
    const { UnauthorizedError } = require("../../../shared/utils/errors");
    authService.refreshSession.mockRejectedValue(new UnauthorizedError("Refresh token missing"));

    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false });

    const cookies = res.headers["set-cookie"] ?? [];
    // Cookie should be cleared (expires in the past or empty value)
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("should return 401 and clear cookie when token is invalid", async () => {
    const { UnauthorizedError } = require("../../../shared/utils/errors");
    authService.refreshSession.mockRejectedValue(new UnauthorizedError("Invalid refresh token"));

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=tampered-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid refresh token");
  });

  it("should return 401 when the associated user no longer exists", async () => {
    const { NotFoundError } = require("../../../shared/utils/errors");
    authService.refreshSession.mockRejectedValue(new NotFoundError("User not found"));

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=valid-but-deleted-user");

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("should return 200 and clear the refreshToken cookie", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", "refreshToken=some-token");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: "Logout successful" });

    const cookies = res.headers["set-cookie"] ?? [];
    // The cleared cookie should have an expires value in the past
    const cleared = cookies.find((c) => c.startsWith("refreshToken="));
    expect(cleared).toBeDefined();
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });

  it("should return 200 even when no cookie is present", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
