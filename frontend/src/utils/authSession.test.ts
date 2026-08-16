import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  IDLE_TIMEOUT_MS,
  clearSessionActivity,
  getLastActivityAt,
  getRemainingIdleTime,
  isSessionIdleExpired,
  markSessionActivity,
} from "./authSession";

describe("authSession utils", () => {
  const realDateNow = Date.now;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Date.now = realDateNow;
  });

  it("should store current timestamp when markSessionActivity is called", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    markSessionActivity();

    expect(localStorage.getItem("lastActivityAt")).toBe("1700000000000");
  });

  it("should remove stored timestamp when clearSessionActivity is called", () => {
    localStorage.setItem("lastActivityAt", "123");

    clearSessionActivity();

    expect(localStorage.getItem("lastActivityAt")).toBeNull();
  });

  it("should return 0 when no stored timestamp exists", () => {
    expect(getLastActivityAt()).toBe(0);
  });

  it("should return null when stored timestamp is invalid", () => {
    localStorage.setItem("lastActivityAt", "not-a-number");

    expect(getLastActivityAt()).toBeNull();
  });

  it("should return stored timestamp as number when valid", () => {
    localStorage.setItem("lastActivityAt", "12345");

    expect(getLastActivityAt()).toBe(12345);
  });

  it("should return false when there is no activity timestamp", () => {
    expect(isSessionIdleExpired()).toBe(false);
  });

  it("should return true when idle timeout has elapsed", () => {
    const now = 2_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("lastActivityAt", String(now - IDLE_TIMEOUT_MS));

    expect(isSessionIdleExpired()).toBe(true);
  });

  it("should return false when idle timeout has not elapsed", () => {
    const now = 2_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("lastActivityAt", String(now - 1000));

    expect(isSessionIdleExpired()).toBe(false);
  });

  it("should return full timeout when no activity exists", () => {
    expect(getRemainingIdleTime()).toBe(IDLE_TIMEOUT_MS);
  });

  it("should return remaining timeout when session is active", () => {
    const now = 10_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("lastActivityAt", String(now - 2500));

    expect(getRemainingIdleTime()).toBe(IDLE_TIMEOUT_MS - 2500);
  });

  it("should clamp remaining time to zero when already expired", () => {
    const now = 10_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("lastActivityAt", String(now - IDLE_TIMEOUT_MS - 1));

    expect(getRemainingIdleTime()).toBe(0);
  });
});
