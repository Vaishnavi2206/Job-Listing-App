import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "../api/axios";
import { loginUser, logoutUser, refreshUserSession, signupUser } from "./auth.service";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call signup endpoint and return response data", async () => {
    const payload = {
      firstName: "Jane",
      lastName: "Doe",
      username: "jane@example.com",
      password: "secret123",
      roleName: "CANDIDATE",
    };
    const data = { success: true };
    vi.mocked(api.post).mockResolvedValue({ data } as any);

    const result = await signupUser(payload as any);

    expect(api.post).toHaveBeenCalledWith("/auth/signup", payload);
    expect(result).toEqual(data);
  });

  it("should call login endpoint and return access token payload", async () => {
    const payload = { username: "jane@example.com", password: "secret123" };
    const data = { accessToken: "token", user: { id: "u1" } };
    vi.mocked(api.post).mockResolvedValue({ data } as any);

    const result = await loginUser(payload as any);

    expect(api.post).toHaveBeenCalledWith("/auth/login", payload);
    expect(result).toEqual(data);
  });

  it("should call refresh endpoint and return session payload", async () => {
    const data = { accessToken: "token-2", user: { id: "u2" } };
    vi.mocked(api.post).mockResolvedValue({ data } as any);

    const result = await refreshUserSession();

    expect(api.post).toHaveBeenCalledWith("/auth/refresh");
    expect(result).toEqual(data);
  });

  it("should call logout endpoint and return response data", async () => {
    const data = { success: true };
    vi.mocked(api.post).mockResolvedValue({ data } as any);

    const result = await logoutUser();

    expect(api.post).toHaveBeenCalledWith("/auth/logout");
    expect(result).toEqual(data);
  });

  it("should propagate API errors", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("network error"));

    await expect(logoutUser()).rejects.toThrow("network error");
  });
});
