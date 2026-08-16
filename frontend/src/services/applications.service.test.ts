import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "../api/axios";
import {
  createApplication,
  getCompanyApplications,
  getMyApplications,
  updateApplicationStatus,
} from "./applications.service";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("applications.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch current user applications", async () => {
    const data = [{ id: "a1" }];
    vi.mocked(api.get).mockResolvedValue({ data: { data } } as any);

    const result = await getMyApplications();

    expect(api.get).toHaveBeenCalledWith("/applications/me");
    expect(result).toEqual(data);
  });

  it("should create application with payload", async () => {
    const payload = { jobListingId: "job-1", resumeUrl: "https://cv" };
    const data = { id: "a2" };
    vi.mocked(api.post).mockResolvedValue({ data: { data } } as any);

    const result = await createApplication(payload as any);

    expect(api.post).toHaveBeenCalledWith("/applications", payload);
    expect(result).toEqual(data);
  });

  it("should fetch company applications by company id", async () => {
    const data = [{ id: "a3" }];
    vi.mocked(api.get).mockResolvedValue({ data: { data } } as any);

    const result = await getCompanyApplications("company-1");

    expect(api.get).toHaveBeenCalledWith("/applications/company/company-1");
    expect(result).toEqual(data);
  });

  it("should update application status", async () => {
    const data = { id: "a4", status: "accepted" };
    vi.mocked(api.patch).mockResolvedValue({ data: { data } } as any);

    const result = await updateApplicationStatus("a4", "accepted");

    expect(api.patch).toHaveBeenCalledWith("/applications/a4/status", { status: "accepted" });
    expect(result).toEqual(data);
  });

  it("should propagate API failures", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("forbidden"));

    await expect(getCompanyApplications("company-2")).rejects.toThrow("forbidden");
  });
});
