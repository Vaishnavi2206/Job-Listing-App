import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import "./Dashboard.css";

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
import type {
  Application,
  ApplicationPayload,
  Company,
  CompanyPayload,
  Job,
  JobPayload,
} from "../types";

import "../App.css";
import EmployerDashboard from "../components/dashboard/EmployerDashboard";
import CandidateDashboard from "../components/dashboard/CandidateDashboard";
import AppliedJobsModal from "./AppliedJobsModal";

type JobFormData = Omit<
  JobPayload,
  "salaryMin" | "salaryMax"
> & {
  salaryMin?: string;
  salaryMax?: string;
};

type ApplicationFormData = Omit<
  ApplicationPayload,
  "jobListingId"
>;

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

const formatSalary = (job: Job) =>
  job.salaryMin || job.salaryMax
    ? `${job.salaryMin || "Open"} - ${
        job.salaryMax || "Open"
      }`
    : "Salary open";

const getApplicationJob = (
  application: Application
) => application.JobListing;

const validApplicationTransitions: Record<
  string,
  string[]
> = {
  pending: ["reviewed", "rejected"],
  reviewed: ["interview", "rejected"],
  interview: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const Dashboard = () => {
  const { user, setToken } = useAuth();
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
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);


  const companyForm = useForm<CompanyPayload>();
  const jobForm = useForm<JobFormData>();
  const applicationForm =
    useForm<ApplicationFormData>();

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

  const loadMoreJobs = async () => {
  if (loadingMore || !hasMore || !nextCursor) {
    return;
  }

  try {
    setLoadingMore(true);
    console.log("nextCursor", nextCursor)
    const response:any = await getJobs(
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

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("nextCursor", nextCursor)
      const [companiesData, jobsData]: [any, any] =
        await Promise.all([getCompanies(), getJobs(10, nextCursor)]);

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
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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

  useEffect(() => {
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
    try {
      const jobsData:any = await getJobs(10,nextCursor,searchTerm);
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
  }, [searchTerm]);

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

  const logout = () => {
    setToken(null);
  };

  return (
    <div className="dashboardPage">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">JOB HUNT</p>
          <h1>Welcome, {user?.firstName || "there"}</h1>
          <p>
            {isEmployer
              ? "Create companies and publish jobs from one workspace."
              : "Your candidate dashboard is ready."}
          </p>
        </div>

        <div className="dashboardActions">
          {!isEmployer && (
            <button
              className="appliedJobsButton"
              onClick={() => setShowAppliedJobs((isVisible) => !isVisible)}
              aria-label="Show applied jobs"
            >
              <span aria-hidden="true">A</span>
              <strong>{applications.length}</strong>
            </button>
          )}

          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {message && <p className="successText">{message}</p>}

      {error && <p className="errorText">{error}</p>}
      {showAppliedJobs && !isEmployer &&
        (applications.length ? (
          <AppliedJobsModal
            applications={applications}
            getApplicationJob={getApplicationJob}
            setSelectedJob={setSelectedJob}
            setShowAppliedJobs={setShowAppliedJobs}
            jobs={jobs}
          />
        ) : (
          <p>No applications yet.</p>
        ))}
      {loading ? (
        <p>Loading dashboard...</p>
      ) : isEmployer ? (
        <EmployerDashboard
          companyForm={companyForm}
          jobForm={jobForm}
          myCompanies={myCompanies}
          myJobs={myJobs}
          applications={applications}
          handleCreateCompany={handleCreateCompany}
          handleCreateJob={handleCreateJob}
          formatSalary={formatSalary}
          validApplicationTransitions={validApplicationTransitions}
          formatStatus={formatStatus}
          updatingApplicationId={updatingApplicationId}
          handleUpdateApplicationStatus={handleUpdateApplicationStatus}
        />
      ) : (
        <CandidateDashboard
          jobs={jobs}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedJob={selectedJob}
          setSelectedJob={setSelectedJob}
          appliedJobIds={appliedJobIds}
          isSearching={isSearching}
          applicationForm={applicationForm}
          handleApply={handleApply}
          formatSalary={formatSalary}
          applying={applying}
          loadingMore={loadingMore}
          hasMore={hasMore}
          loadMore={loadMoreJobs}
        />
      )}
    </div>
  );
};

export default Dashboard;
