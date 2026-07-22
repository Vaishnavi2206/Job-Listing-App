import type { Company } from "./company.types";

export type Job = {
  id: string;
  title: string;
  description: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  companyId: string;
  Company?: Company;
  applied?: boolean;
};

export type PaginatedJobsResponse = {
  jobs: Job[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type JobPayload = {
  title: string;
  description: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  companyId: string;
};
