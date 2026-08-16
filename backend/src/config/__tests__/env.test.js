"use strict";

describe("config/env", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should load .env.local in development", () => {
    const configMock = jest.fn();
    jest.doMock("dotenv", () => ({ config: configMock }));

    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    jest.isolateModules(() => {
      require("../env");
    });

    expect(configMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining(".env.local") })
    );

    process.env.NODE_ENV = original;
  });

  it("should load .env outside development", () => {
    const configMock = jest.fn();
    jest.doMock("dotenv", () => ({ config: configMock }));

    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    jest.isolateModules(() => {
      require("../env");
    });

    expect(configMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining(".env") })
    );

    process.env.NODE_ENV = original;
  });
});
