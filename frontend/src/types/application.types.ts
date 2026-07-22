import type { Company } from "./company.types";
import type { Job } from "./job.types";

export type Application = {
  id: string;
  candidateId: string;
  companyId: string;
  jobListingId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  JobListing?: Job;
  Company?: Company;
  User?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
};

export type ApplicationPayload = {
  jobListingId: string;
  resumeUrl?: string;
  coverLetter?: string;
};
