"use strict";

const mockDefine = jest.fn((name, schema, options) => ({ name, schema, options }));

jest.mock("../../../config/db", () => ({
  define: mockDefine,
}));

describe("user.model", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should define User model with expected table options", () => {
    const User = require("../user.model");

    expect(mockDefine).toHaveBeenCalledWith(
      "User",
      expect.any(Object),
      expect.objectContaining({
        tableName: "users",
        timestamps: true,
        underscored: true,
      })
    );
    expect(User.name).toBe("User");
  });

  it("should lowercase username via custom setter", () => {
    const User = require("../user.model");
    const setUsername = User.schema.username.set;

    const instance = {
      setDataValue: jest.fn(),
    };

    setUsername.call(instance, "TeSt@Example.COM");

    expect(instance.setDataValue).toHaveBeenCalledWith("username", "test@example.com");
  });
});
