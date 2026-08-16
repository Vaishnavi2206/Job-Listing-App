import { describe, it, expect } from "vitest";

import {
  formatSalary,
  formatStatus,
  getApplicationJob,
  validApplicationTransitions,
} from "./dashboard.utils";

describe("dashboard.utils", () => {
  it("should format salary range when both min and max exist", () => {
    const result = formatSalary({ salaryMin: 1000, salaryMax: 5000 } as any);

    expect(result).toBe("1000 - 5000");
  });

  it("should format salary with Open for missing min", () => {
    const result = formatSalary({ salaryMax: 5000 } as any);

    expect(result).toBe("Open - 5000");
  });

  it("should format salary with Open for missing max", () => {
    const result = formatSalary({ salaryMin: 1000 } as any);

    expect(result).toBe("1000 - Open");
  });

  it("should return Salary open when min and max are both missing", () => {
    const result = formatSalary({} as any);

    expect(result).toBe("Salary open");
  });

  it("should capitalize first letter of status", () => {
    expect(formatStatus("pending")).toBe("Pending");
  });

  it("should return the job listing from application", () => {
    const job = { id: "job-1" };

    expect(getApplicationJob({ JobListing: job } as any)).toBe(job);
  });

  it("should include expected status transitions", () => {
    expect(validApplicationTransitions.pending).toEqual(["accepted", "rejected"]);
    expect(validApplicationTransitions.rejected).toEqual([]);
  });
});
