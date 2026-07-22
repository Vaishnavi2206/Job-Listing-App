import type { JobPayload } from "./job.types";
import type { ApplicationPayload } from "./application.types";

// Salary fields are string in the form (HTML input), converted to number before submission
export type JobFormData = Omit<JobPayload, "salaryMin" | "salaryMax"> & {
  salaryMin?: string;
  salaryMax?: string;
};

// jobListingId is injected from selectedJob at submit time, not entered by the user
export type ApplicationFormData = Omit<ApplicationPayload, "jobListingId">;
