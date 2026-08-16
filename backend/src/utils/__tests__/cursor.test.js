"use strict";

const { encodeCursor, decodeCursor } = require("../cursor");

describe("cursor utils", () => {
  it("should encode and decode cursor round-trip", () => {
    const payload = { createdAt: "2026-01-01T00:00:00.000Z", id: "abc-123" };

    const encoded = encodeCursor(payload);
    const decoded = decodeCursor(encoded);

    expect(typeof encoded).toBe("string");
    expect(decoded).toEqual(payload);
  });

  it("should return null when decodeCursor receives nullish value", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor("")).toBeNull();
  });

  it("should return null for malformed base64/json", () => {
    expect(decodeCursor("not-base64")).toBeNull();
  });
});
