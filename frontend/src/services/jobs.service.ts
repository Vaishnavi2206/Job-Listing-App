import api from "../api/axios";
import type { Job, JobPayload } from "../types";
import type { PaginatedJobsResponse } from "../types/job.types";

export const getJobs = async (limit = 10, cursor?: string | null, search?: string): Promise<PaginatedJobsResponse> => {
  console.log("api call", cursor);
  const response = await api.get("/jobs", {
    params: {
        limit,
        cursor,
        search
        }
  });

  return response.data.data;
};

export const createJob = async (
  payload: JobPayload
): Promise<Job> => {
  const response = await api.post("/jobs", payload);

  return response.data.data;
};
