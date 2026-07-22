export type Company = {
  id: string;
  name: string;
  description?: string;
  employeeSize?: string;
  location?: string;
  category?: string;
  createdBy: string;
};

export type CompanyPayload = {
  name: string;
  description?: string;
  employeeSize?: string;
  location?: string;
  category?: string;
};
