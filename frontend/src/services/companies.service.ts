import api from "../api/axios";
import type { Company, CompanyPayload } from "../types";

export const getCompanies = async (): Promise<Company[]> => {
  const response = await api.get("/companies");

  return response.data.data;
};

export const createCompany = async (payload: CompanyPayload): Promise<Company> => {
  const response = await api.post("/companies", payload);

  return response.data.data;
};
