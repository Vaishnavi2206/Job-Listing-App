"use strict";

const mockOn = jest.fn();
const mockIORedis = jest.fn().mockImplementation(() => ({
  on: mockOn,
}));

jest.mock("ioredis", () => mockIORedis);

describe("config/redis", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should build redis options with defaults", () => {
    const { buildRedisOptions } = require("../redis");

    const options = buildRedisOptions();

    expect(options.host).toBeDefined();
    expect(options.port).toBeDefined();
    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.enableReadyCheck).toBe(true);
    expect(typeof options.retryStrategy).toBe("function");
    expect(options.retryStrategy(1)).toBe(200);
    expect(options.retryStrategy(50)).toBe(5000);
  });

  it("should include tls option when REDIS_TLS=true", () => {
    const original = process.env.REDIS_TLS;
    process.env.REDIS_TLS = "true";
    const { buildRedisOptions } = require("../redis");

    const options = buildRedisOptions();

    expect(options.tls).toEqual({});

    process.env.REDIS_TLS = original;
  });

  it("should create redis connection and register listeners", () => {
    const { createRedisConnection } = require("../redis");

    createRedisConnection();

    expect(mockIORedis).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("connect", expect.any(Function));
  });

  it("should log redis events outside test env", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJestWorker = process.env.JEST_WORKER_ID;
    process.env.NODE_ENV = "production";
    delete process.env.JEST_WORKER_ID;

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { createRedisConnection } = require("../redis");
    logSpy.mockClear();
    errSpy.mockClear();
    createRedisConnection();

    const errorHandler = mockOn.mock.calls.find(([event]) => event === "error")[1];
    const connectHandler = mockOn.mock.calls.find(([event]) => event === "connect")[1];

    errorHandler(new Error("network"));
    connectHandler();

    expect(errSpy).toHaveBeenCalledWith("[redis] connection error:", "network");
    expect(logSpy).toHaveBeenCalledWith("[redis] connected");

    logSpy.mockRestore();
    errSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JEST_WORKER_ID = originalJestWorker;
  });

  it("should suppress redis logs in test env", () => {
    process.env.NODE_ENV = "test";
    process.env.JEST_WORKER_ID = "1";

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { createRedisConnection } = require("../redis");
    createRedisConnection();

    const errorHandler = mockOn.mock.calls.find(([event]) => event === "error")[1];
    const connectHandler = mockOn.mock.calls.find(([event]) => event === "connect")[1];

    errorHandler(new Error("network"));
    connectHandler();

    expect(errSpy).not.toHaveBeenCalledWith("[redis] connection error:", expect.any(String));
    expect(logSpy).not.toHaveBeenCalledWith("[redis] connected");

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
