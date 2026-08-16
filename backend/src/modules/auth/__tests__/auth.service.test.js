"use strict";

jest.mock("../../../modules/users/user.model");
jest.mock("../../../modules/roles/role.model");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../../modules/users/user.model");
const Role = require("../../../modules/roles/role.model");
const { signup, login, refreshSession } = require("../auth.service");
const {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../../../shared/utils/errors");

const mockRole = { id: 1, name: "candidate" };
const mockUser = {
  id: 42,
  firstName: "Jane",
  lastName: "Doe",
  username: "jane@example.com",
  password: "hashed",
  roleId: 1,
  Role: mockRole,
};

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

// ─── signup ───────────────────────────────────────────────────────────────────

describe("signup", () => {
  const payload = {
    firstName: "Jane",
    lastName: "Doe",
    username: "jane@example.com",
    password: "password123",
    roleName: "candidate",
  };

  it("should create and return a new user on happy path", async () => {
    User.findOne.mockResolvedValue(null);
    Role.findOne.mockResolvedValue(mockRole);
    bcrypt.hash.mockResolvedValue("hashed");
    User.create.mockResolvedValue({
      id: 42,
      firstName: "Jane",
      lastName: "Doe",
      username: "jane@example.com",
    });

    const result = await signup(payload);

    expect(User.findOne).toHaveBeenCalledWith({ where: { username: payload.username } });
    expect(Role.findOne).toHaveBeenCalledWith({ where: { name: payload.roleName } });
    expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 10);
    expect(result).toEqual({
      id: 42,
      firstName: "Jane",
      lastName: "Doe",
      username: "jane@example.com",
      roleName: "candidate",
    });
  });

  it("should throw ConflictError when username already exists", async () => {
    User.findOne.mockResolvedValue(mockUser);

    await expect(signup(payload)).rejects.toThrow(ConflictError);
    await expect(signup(payload)).rejects.toThrow("Username already exists");
    expect(Role.findOne).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when role does not exist", async () => {
    User.findOne.mockResolvedValue(null);
    Role.findOne.mockResolvedValue(null);

    await expect(signup(payload)).rejects.toThrow(BadRequestError);
    await expect(signup(payload)).rejects.toThrow("Invalid role");
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("should propagate DB error from User.create", async () => {
    User.findOne.mockResolvedValue(null);
    Role.findOne.mockResolvedValue(mockRole);
    bcrypt.hash.mockResolvedValue("hashed");
    User.create.mockRejectedValue(new Error("DB error"));

    await expect(signup(payload)).rejects.toThrow("DB error");
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe("login", () => {
  const credentials = { username: "jane@example.com", password: "password123" };

  it("should return tokens and user on valid credentials", async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValueOnce("access-token").mockReturnValueOnce("refresh-token");

    const result = await login(credentials);

    expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
    expect(result).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        username: mockUser.username,
        roleName: mockRole.name,
      },
    });
  });

  it("should throw UnauthorizedError when user is not found", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(login(credentials)).rejects.toThrow(UnauthorizedError);
    await expect(login(credentials)).rejects.toThrow("Invalid credentials");
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when password is wrong", async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(login(credentials)).rejects.toThrow(UnauthorizedError);
    await expect(login(credentials)).rejects.toThrow("Invalid credentials");
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("should propagate DB error from User.findOne", async () => {
    User.findOne.mockRejectedValue(new Error("connection refused"));

    await expect(login(credentials)).rejects.toThrow("connection refused");
  });
});

// ─── refreshSession ───────────────────────────────────────────────────────────

describe("refreshSession", () => {
  it("should return new tokens and user when refresh token is valid", async () => {
    jwt.verify.mockReturnValue({ userId: 42 });
    User.findByPk.mockResolvedValue(mockUser);
    jwt.sign.mockReturnValueOnce("new-access-token").mockReturnValueOnce("new-refresh-token");

    const result = await refreshSession("valid-refresh-token");

    expect(jwt.verify).toHaveBeenCalledWith("valid-refresh-token", expect.any(String));
    expect(User.findByPk).toHaveBeenCalledWith(42, expect.objectContaining({ include: expect.any(Array) }));
    expect(result).toMatchObject({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: {
        id: mockUser.id,
        roleName: mockRole.name,
      },
    });
  });

  it("should throw UnauthorizedError when refresh token is missing", async () => {
    await expect(refreshSession(null)).rejects.toThrow(UnauthorizedError);
    await expect(refreshSession(undefined)).rejects.toThrow("Refresh token missing");
    await expect(refreshSession("")).rejects.toThrow("Refresh token missing");
  });

  it("should throw UnauthorizedError when jwt.verify throws", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    await expect(refreshSession("expired-token")).rejects.toThrow(UnauthorizedError);
    await expect(refreshSession("expired-token")).rejects.toThrow("Invalid refresh token");
  });

  it("should throw NotFoundError when user no longer exists in DB", async () => {
    jwt.verify.mockReturnValue({ userId: 99 });
    User.findByPk.mockResolvedValue(null);

    await expect(refreshSession("valid-token")).rejects.toThrow(NotFoundError);
    await expect(refreshSession("valid-token")).rejects.toThrow("User not found");
  });

  it("should throw UnauthorizedError for a malformed token", async () => {
    jwt.verify.mockImplementation(() => {
      const err = new Error("invalid signature");
      err.name = "JsonWebTokenError";
      throw err;
    });

    await expect(refreshSession("bad-token")).rejects.toThrow(UnauthorizedError);
  });

  it("should fall back to JWT_SECRET when JWT_REFRESH_SECRET is missing", async () => {
    delete process.env.JWT_REFRESH_SECRET;
    jwt.verify.mockReturnValue({ userId: 42 });
    User.findByPk.mockResolvedValue(mockUser);
    jwt.sign.mockReturnValueOnce("access").mockReturnValueOnce("refresh");

    await refreshSession("valid-refresh-token");

    expect(jwt.verify).toHaveBeenCalledWith("valid-refresh-token", process.env.JWT_SECRET);
    expect(jwt.sign).toHaveBeenNthCalledWith(
      2,
      { userId: mockUser.id },
      process.env.JWT_SECRET,
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
  });
});

// ─── JWT_SECRET guard ─────────────────────────────────────────────────────────

describe("getAccessTokenSecret (via login)", () => {
  it("should throw when JWT_SECRET is not set", async () => {
    delete process.env.JWT_SECRET;
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    await expect(login({ username: "jane@example.com", password: "password123" })).rejects.toThrow(
      "JWT_SECRET is required"
    );
  });
});
