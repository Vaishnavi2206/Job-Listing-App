import { createContext, useMemo, useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { Company, Application, CompanyPayload } from "../types";
import type { JobFormData, ApplicationFormData } from "../types/form.types";
import useAuth from "../hooks/useAuth";
import { createCompany, getCompanies } from "../services/companies.service";
import { createJob } from "../services/jobs.service";
import {
  createApplication,
  getCompanyApplications,
  getMyApplications,
  updateApplicationStatus,
} from "../services/applications.service";

const getErrorMessage = (requestError: unknown, fallback: string) => {
  const response = (requestError as { response?: { data?: { message?: string } } }).response;
  return response?.data?.message || fallback;
};

const formatStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

export interface DashboardContextValue {
  companies: Company[];
  myCompanies: Company[];
  applications: Application[];
  appliedJobIds: Set<string>;
  loading: boolean;
  error: string;
  message: string;
  showAppliedJobs: boolean;
  setShowAppliedJobs: React.Dispatch<React.SetStateAction<boolean>>;
  applying: boolean;
  updatingApplicationId: string | null;
  companyForm: UseFormReturn<CompanyPayload>;
  jobForm: UseFormReturn<JobFormData>;
  applicationForm: UseFormReturn<ApplicationFormData>;
  handleCreateCompany: (data: CompanyPayload) => Promise<void>;
  handleCreateJob: (data: JobFormData) => Promise<void>;
  handleApply: (data: ApplicationFormData, selectedJobId: string) => Promise<void>;
  handleUpdateApplicationStatus: (id: string, status: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);
export default DashboardContext;

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const isEmployer = user?.roleName === "EMPLOYER";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showAppliedJobs, setShowAppliedJobs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const companyForm = useForm<CompanyPayload>();
  const jobForm = useForm<JobFormData>();
  const applicationForm = useForm<ApplicationFormData>();

  const myCompanies = useMemo(
    () => companies.filter((c) => c.createdBy === user?.id),
    [companies, user?.id]
  );

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => a.jobListingId)),
    [applications]
  );

  const loadCompaniesAndApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const companiesData = await getCompanies();
      const employerCompanies = companiesData.filter((c) => c.createdBy === user?.id);
      const applicationsData = isEmployer
        ? (await Promise.all(employerCompanies.map((c) => getCompanyApplications(c.id)))).flat()
        : await getMyApplications();
      setCompanies(companiesData);
      setApplications(applicationsData);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load dashboard data"));
    } finally {
      setLoading(false);
    }
  }, [user, isEmployer]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCompaniesAndApplications();
  }, [loadCompaniesAndApplications]);

  const handleCreateCompany = async (data: CompanyPayload) => {
    try {
      setError("");
      setMessage("");
      await createCompany(data);
      companyForm.reset();
      setMessage("Company created successfully");
      await loadCompaniesAndApplications();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create company"));
    }
  };

  // Does not reload jobs — EmployerDashboard calls reloadJobs() from useJobs() after this resolves
  const handleCreateJob = async (data: JobFormData) => {
    try {
      setError("");
      setMessage("");
      await createJob({
        ...data,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
      });
      jobForm.reset();
      setMessage("Job created successfully");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to create job"));
      throw requestError;
    }
  };

  const handleApply = async (data: ApplicationFormData, selectedJobId: string) => {
    try {
      setApplying(true);
      setError("");
      setMessage("");
      await createApplication({ ...data, jobListingId: selectedJobId });
      applicationForm.reset();
      setMessage("Application submitted successfully");
      setApplications(await getMyApplications());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to apply for this job"));
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      setUpdatingApplicationId(applicationId);
      setError("");
      setMessage("");
      await updateApplicationStatus(applicationId, status);
      setMessage(`Application moved to ${formatStatus(status)}`);
      await loadCompaniesAndApplications();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update application status"));
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <DashboardContext.Provider
      value={{
        companies,
        myCompanies,
        applications,
        appliedJobIds,
        loading,
        error,
        message,
        showAppliedJobs,
        setShowAppliedJobs,
        applying,
        updatingApplicationId,
        companyForm,
        jobForm,
        applicationForm,
        handleCreateCompany,
        handleCreateJob,
        handleApply,
        handleUpdateApplicationStatus,
        handleLogout,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
