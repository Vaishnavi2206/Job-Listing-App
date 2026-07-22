import type { Company, Job, Application, CompanyPayload } from "../types";
import type {JobFormData, ApplicationFormData} from "../types/form.types";
import type { UseFormReturn } from "react-hook-form";
import { createContext, useMemo, useCallback } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useAuth from "../hooks/useAuth";
import {
  createCompany,
  getCompanies,
} from "../services/companies.service";
import {
  createJob,
  getJobs,
} from "../services/jobs.service";
import {
  createApplication,
  getCompanyApplications,
  getMyApplications,
  updateApplicationStatus,
} from "../services/applications.service";

const getErrorMessage = (
  requestError: unknown,
  fallback: string
) => {
  const response = (
    requestError as {
      response?: { data?: { message?: string } };
    }
  ).response;

  return response?.data?.message || fallback;
};

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export interface DashboardContextValue {
  companies: Company[];
  jobs: Job[];
  applications: Application[];
  selectedJob: Job | null;
  showAppliedJobs: boolean;
  loading: boolean;
  applying: boolean;
  updatingApplicationId: string | null;
  message: string;
  error: string;
  searchTerm: string;
  isSearching: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  hasMore: boolean;
  setSelectedJob: (job: Job | null) => void;
  setSearchTerm: (term: string) => void;
  setShowAppliedJobs: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: (loading: boolean) => void;
  setApplying: (applying: boolean) => void;
  setUpdatingApplicationId: (id: string | null) => void;
  setMessage: (message: string) => void;
  setError: (error: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setNextCursor: (cursor: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  loadMoreJobs: () => void;
  handleCreateCompany: (data: CompanyPayload) => Promise<void>;
  handleCreateJob: (data: JobFormData) => Promise<void>;
  handleApply: (data: ApplicationFormData) => Promise<void>;
  handleUpdateApplicationStatus: (id: string, status: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  myCompanies: Company[];
  myJobs: Job[];
  appliedJobIds: Set<string>;
  companyForm: UseFormReturn<CompanyPayload>;
  jobForm: UseFormReturn<JobFormData>;
  applicationForm: UseFormReturn<ApplicationFormData>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);
export default DashboardContext;

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const isEmployer = user?.roleName === "EMPLOYER";

  const [companies, setCompanies] = useState<Company[]>(
    []
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<
    Application[]
  >([]);
  const [selectedJob, setSelectedJob] =
    useState<Job | null>(null);
  const [showAppliedJobs, setShowAppliedJobs] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] =
    useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

    const companyForm = useForm<CompanyPayload>();
  const jobForm = useForm<JobFormData>();
  const applicationForm =
    useForm<ApplicationFormData>();
  // 2. Move ALL useMemo declarations from Dashboard.tsx here
    const myCompanies = useMemo(
      () =>
        companies.filter(
          (company) => company.createdBy === user?.id
        ),
      [companies, user?.id],
    );
  
    const myJobs = useMemo(
      () =>
        jobs.filter((job) =>
          myCompanies.some(
            (company) => company.id === job.companyId
          )
        ),
      [jobs, myCompanies],
    );
  
    const appliedJobIds = useMemo(
      () =>
        new Set(
          applications.map(
            (application) => application.jobListingId
          )
        ),
      [applications],
    );
  // 3. Move ALL handler functions from Dashboard.tsx here (loadMoreJobs, handleCreateCompany, etc.)
  
      const loadDashboard = useCallback(async () => {
      try {
        setLoading(true);
        setError("");
  
        const [companiesData, jobsData] =
          await Promise.all([getCompanies(), getJobs(10, null)]);
  
        const employerCompanies = companiesData.filter(
          (company) => company.createdBy === user?.id
        );
  
        const applicationsData = isEmployer
          ? (
              await Promise.all(
                employerCompanies.map((company) =>
                  getCompanyApplications(company.id)
                )
              )
            ).flat()
          : await getMyApplications();
  
        setCompanies(companiesData);
        setJobs(jobsData.jobs);
        setNextCursor(jobsData.pagination.nextCursor);
        setHasMore(jobsData.pagination.hasMore);
        setApplications(applicationsData);
        setSelectedJob(
          (currentJob) => currentJob || jobsData.jobs[0] || null
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to load dashboard data"
          )
        );
      } finally {
        setLoading(false);
      }
    }, [user, isEmployer]);
  
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboard();
    }, [loadDashboard]);


    const loadMoreJobs = async () => {
    if (loadingMore || !hasMore || !nextCursor) {
      return;
    }
  
    try {
      setLoadingMore(true);
      console.log("nextCursor", nextCursor)
      const response = await getJobs(
        10,
        nextCursor
      );
  
      console.log("response.pagination.nextCursor",response.pagination.nextCursor)
  
      console.log("response", response)
  
      setJobs((prev) => [...prev, ...response.jobs]);
  
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  
    const handleCreateCompany = async (
      data: CompanyPayload
    ) => {
      try {
        setError("");
        setMessage("");
  
        await createCompany(data);
  
        companyForm.reset();
        setMessage("Company created successfully");
        await loadDashboard();
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to create company"
          )
        );
      }
    };

      const handleCreateJob = async (data: JobFormData) => {
        try {
          setError("");
          setMessage("");
    
          await createJob({
            ...data,
            salaryMin: data.salaryMin
              ? Number(data.salaryMin)
              : undefined,
            salaryMax: data.salaryMax
              ? Number(data.salaryMax)
              : undefined,
          });
    
          jobForm.reset();
          setMessage("Job created successfully");
          await loadDashboard();
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to create job"
            )
          );
        }
      };

        const handleApply = async (
    data: ApplicationFormData
  ) => {
    if (!selectedJob) {
      return;
    }

    try {
      setApplying(true);
      setError("");
      setMessage("");

      await createApplication({
        ...data,
        jobListingId: selectedJob.id,
      });

      applicationForm.reset();
      setMessage("Application submitted successfully");
      setApplications(await getMyApplications());
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to apply for this job"
        )
      );
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: string
  ) => {
    try {
      setUpdatingApplicationId(applicationId);
      setError("");
      setMessage("");

      await updateApplicationStatus(
        applicationId,
        status
      );

      setMessage(
        `Application moved to ${formatStatus(status)}`
      );
      await loadDashboard();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to update application status"
        )
      );
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
  };
  // 4. Move the useForm calls from Dashboard.tsx here

  // 5. Move the useEffect calls (loadDashboard, search debounce) from Dashboard.tsx here

    useEffect(() => {
      const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const jobsData = await getJobs(10,nextCursor,searchTerm);
        setIsSearching(false);
        // setJobs(jobsData);
  
          setJobs((prev) => [...prev, ...jobsData.jobs]);
          setNextCursor(jobsData.pagination.nextCursor);
          setHasMore(jobsData.pagination.hasMore);
  
          if (jobsData.jobs.length > 0) {
            setSelectedJob(jobsData.jobs[0]);
          } else {
            setSelectedJob(null);
          }
        } catch (error) {
          setIsSearching(false);
          console.error(error);
        }
      }, 300);
  
  
      return () => clearTimeout(timeoutId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);
  


  return (
    <DashboardContext.Provider value={{
      companies, jobs, applications,
      selectedJob, setSelectedJob,
      showAppliedJobs, setShowAppliedJobs,
      loading, setLoading,
      applying, setApplying,
      updatingApplicationId, setUpdatingApplicationId,
      message, setMessage,
      error, setError,
      searchTerm, setSearchTerm,
      isSearching, setIsSearching,
      loadingMore, setLoadingMore,
      nextCursor, setNextCursor,
      hasMore, setHasMore,
      myCompanies, myJobs, appliedJobIds,
      companyForm, jobForm, applicationForm,
      loadMoreJobs,
      handleCreateCompany, handleCreateJob, handleApply,
      handleUpdateApplicationStatus, handleLogout,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};