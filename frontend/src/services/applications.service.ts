import api from "../api/axios";
import type {
  Application,
  ApplicationPayload,
} from "../types";

export const getMyApplications = async (): Promise<
  Application[]
> => {
  const response = await api.get("/applications/me");

  return response.data.data;
};

export const createApplication = async (
  payload: ApplicationPayload
): Promise<Application> => {
  const response = await api.post(
    "/applications",
    payload
  );

  return response.data.data;
};

export const getCompanyApplications = async (
  companyId: string
): Promise<Application[]> => {
  const response = await api.get(
    `/applications/company/${companyId}`
  );

  return response.data.data;
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: string
): Promise<Application> => {
  const response = await api.patch(
    `/applications/${applicationId}/status`,
    { status }
  );

  return response.data.data;
};
