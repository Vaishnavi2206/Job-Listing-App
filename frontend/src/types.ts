export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  roleName: "EMPLOYER" | "CANDIDATE";
};

export type Company = {
  id: string;
  name: string;
  description?: string;
  employeeSize?: string;
  location?: string;
  category?: string;
  createdBy: string;
};

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

export type SignupPayload = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  roleName: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type CompanyPayload = {
  name: string;
  description?: string;
  employeeSize?: string;
  location?: string;
  category?: string;
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
