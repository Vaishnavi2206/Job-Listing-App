import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "../api/axios";
import { createJob, getJobs } from "./jobs.service";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("jobs.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch jobs with default params", async () => {
    const data = { jobs: [], pagination: { nextCursor: null, hasMore: false } };
    vi.mocked(api.get).mockResolvedValue({ data: { data } } as any);

    const result = await getJobs();

    expect(api.get).toHaveBeenCalledWith("/jobs", {
      params: {
        limit: 10,
        cursor: undefined,
        search: undefined,
      },
    });
    expect(result).toEqual(data);
  });

  it("should fetch jobs with provided limit cursor and search", async () => {
    const data = { jobs: [{ id: "j1" }], pagination: { nextCursor: "c1", hasMore: true } };
    vi.mocked(api.get).mockResolvedValue({ data: { data } } as any);

    const result = await getJobs(5, "cursor-1", "frontend");

    expect(api.get).toHaveBeenCalledWith("/jobs", {
      params: {
        limit: 5,
        cursor: "cursor-1",
        search: "frontend",
      },
    });
    expect(result).toEqual(data);
  });

  it("should create a job", async () => {
    const payload = { title: "Frontend Engineer", description: "Build UI", companyId: "c1" };
    const data = { id: "j2", ...payload };
    vi.mocked(api.post).mockResolvedValue({ data: { data } } as any);

    const result = await createJob(payload as any);

    expect(api.post).toHaveBeenCalledWith("/jobs", payload);
    expect(result).toEqual(data);
  });
});
