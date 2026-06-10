import api from "../api/axios";
import type { Job, JobPayload } from "../types";

export const getJobs = async (pageSize = 10, pageNo = 1,search?:string): Promise<Job[]> => {
  const response = await api.get("/jobs", {
    params: search
      ? {
        pageSize,
        pageNo,
          search
        }
      : undefined,
  });

  return response.data.data;
};

export const createJob = async (
  payload: JobPayload
): Promise<Job> => {
  const response = await api.post("/jobs", payload);

  return response.data.data;
};
