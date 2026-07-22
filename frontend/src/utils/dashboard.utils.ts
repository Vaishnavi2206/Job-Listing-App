import type { Job, Application } from "../types";

export const formatSalary = (job: Job) =>
  job.salaryMin || job.salaryMax
    ? `${job.salaryMin || "Open"} - ${job.salaryMax || "Open"}`
    : "Salary open";

export const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const getApplicationJob = (application: Application) =>
  application.JobListing;

export const validApplicationTransitions: Record<string, string[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["interview", "rejected"],
  interview: ["hired", "rejected"],
  rejected: [],
  hired: [],
};
