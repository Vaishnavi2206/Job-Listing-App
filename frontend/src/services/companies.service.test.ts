import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "../api/axios";
import { createCompany, getCompanies } from "./companies.service";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("companies.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch companies list", async () => {
    const data = [{ id: "c1", name: "Acme" }];
    vi.mocked(api.get).mockResolvedValue({ data: { data } } as any);

    const result = await getCompanies();

    expect(api.get).toHaveBeenCalledWith("/companies");
    expect(result).toEqual(data);
  });

  it("should create a company", async () => {
    const payload = { name: "Acme" };
    const data = { id: "c2", name: "Acme" };
    vi.mocked(api.post).mockResolvedValue({ data: { data } } as any);

    const result = await createCompany(payload as any);

    expect(api.post).toHaveBeenCalledWith("/companies", payload);
    expect(result).toEqual(data);
  });

  it("should propagate API failures", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("conflict"));

    await expect(createCompany({ name: "Acme" } as any)).rejects.toThrow("conflict");
  });
});
