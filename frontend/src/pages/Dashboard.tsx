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
import { JobCardSkeletonList } from "./JobCardSkeletonList";
import { JobDetailsSkeleton } from "./JobDetailsSkeleton";

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

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [companiesData, jobsData] =
        await Promise.all([getCompanies(), getJobs()]);

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
      setJobs(jobsData);
      setApplications(applicationsData);
      setSelectedJob(
        (currentJob) => currentJob || jobsData[0] || null
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
      const jobsData = await getJobs(10,0,searchTerm);
      setIsSearching(false);
      setJobs(jobsData);

        if (jobsData.length > 0) {
          setSelectedJob(jobsData[0]);
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
          <p className="eyebrow">Dashboard</p>
          <h1>
            Welcome, {user?.firstName || "there"}
          </h1>
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
              onClick={() =>
                setShowAppliedJobs(
                  (isVisible) => !isVisible
                )
              }
              aria-label="Show applied jobs"
            >
              <span aria-hidden="true">A</span>
              <strong>{applications.length}</strong>
            </button>
          )}

          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {message && (
        <p className="successText">{message}</p>
      )}

      {error && <p className="errorText">{error}</p>}

      {showAppliedJobs && !isEmployer && (
        <section className="appliedJobsPanel">
          <div className="appliedJobsHeader">
            <h2>Applied Jobs</h2>
            <button
              onClick={() => setShowAppliedJobs(false)}
              aria-label="Close applied jobs"
            >
              x
            </button>
          </div>

          {applications.length ? (
            <div className="appliedJobsList">
              {applications.map((application) => {
                const job =
                  getApplicationJob(application);

                return (
                  <button
                    className="appliedJobItem"
                    key={application.id}
                    onClick={() => {
                      const listedJob = jobs.find(
                        (availableJob) =>
                          availableJob.id ===
                          application.jobListingId
                      );

                      if (listedJob || job) {
                        setSelectedJob(
                          listedJob || job || null
                        );
                      }
                      setShowAppliedJobs(false);
                    }}
                  >
                    <span>{job?.title || "Job"}</span>
                    <small>
                      {application.Company?.name ||
                        job?.Company?.name ||
                        "Company"}
                    </small>
                    <strong>
                      {application.status}
                    </strong>
                  </button>
                );
              })}
            </div>
          ) : (
            <p>No applications yet.</p>
          )}
        </section>
      )}

      {loading ? (
        <p>Loading dashboard...</p>
      ) : isEmployer ? (
        <>
          <section className="dashboardGrid">
            <div className="dashboardCard">
              <h2>Create Company</h2>

              <form
                onSubmit={companyForm.handleSubmit(
                  handleCreateCompany
                )}
              >
                <input
                  type="text"
                  placeholder="Company name"
                  {...companyForm.register("name", {
                    required: true,
                  })}
                />

                <textarea
                  placeholder="Company description"
                  {...companyForm.register("description")}
                />

                <input
                  type="text"
                  placeholder="Employee size"
                  {...companyForm.register("employeeSize")}
                />

                <input
                  type="text"
                  placeholder="Location"
                  {...companyForm.register("location")}
                />

                <input
                  type="text"
                  placeholder="Category"
                  {...companyForm.register("category")}
                />

                <button type="submit">
                  Create Company
                </button>
              </form>
            </div>

            <div className="dashboardCard">
              <h2>Create Job</h2>

              <form
                onSubmit={jobForm.handleSubmit(
                  handleCreateJob
                )}
              >
                <select
                  {...jobForm.register("companyId", {
                    required: true,
                  })}
                >
                  <option value="">
                    Select company
                  </option>

                  {myCompanies.map((company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Job title"
                  {...jobForm.register("title", {
                    required: true,
                  })}
                />

                <textarea
                  placeholder="Job description"
                  {...jobForm.register("description", {
                    required: true,
                  })}
                />

                <input
                  type="text"
                  placeholder="Location"
                  {...jobForm.register("location")}
                />

                <input
                  type="number"
                  placeholder="Minimum salary"
                  {...jobForm.register("salaryMin")}
                />

                <input
                  type="number"
                  placeholder="Maximum salary"
                  {...jobForm.register("salaryMax")}
                />

                <select
                  {...jobForm.register("employmentType")}
                >
                  <option value="">
                    Employment type
                  </option>
                  <option value="Full Time">
                    Full Time
                  </option>
                  <option value="Part Time">
                    Part Time
                  </option>
                  <option value="Contract">
                    Contract
                  </option>
                  <option value="Internship">
                    Internship
                  </option>
                </select>

                <button
                  type="submit"
                  disabled={!myCompanies.length}
                >
                  Create Job
                </button>
              </form>
            </div>
          </section>

          <section className="dashboardSection">
            <h2>Your Companies</h2>

            <div className="jobsGrid listingGrid">
              {myCompanies.map((company) => (
                <div
                  className="jobCard"
                  key={company.id}
                >
                  <h3>{company.name}</h3>
                  <p
                    className="cardDescription"
                    title={company.description}
                  >
                    {company.description}
                  </p>
                  <div className="jobMeta">
                    {company.location && (
                      <span className="metaPill metaLocation">
                        {company.location}
                      </span>
                    )}
                    {company.employeeSize && (
                      <span className="metaPill metaSalary">
                        {company.employeeSize}
                      </span>
                    )}
                    {company.category && (
                      <span className="metaPill metaType">
                        {company.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboardSection">
            <h2>Your Jobs</h2>

            <div className="jobsGrid listingGrid">
     
             {myJobs.map((job) => (
                <div
                  className="jobCard"
                  key={job.id}
                >
                  <h3>{job.title}</h3>
                  <p
                    className="cardDescription"
                    title={job.description}
                  >
                    {job.description}
                  </p>
                  <div className="jobMeta">
                    {job.location && (
                      <span className="metaPill metaLocation">
                        {job.location}
                      </span>
                    )}
                    <span className="metaPill metaSalary">
                      {formatSalary(job)}
                    </span>
                    {job.employmentType && (
                      <span className="metaPill metaType">
                        {job.employmentType}
                      </span>
                    )}
                  </div>
                  <div className="companyName">
                    {job.Company?.name}
                  </div>
                </div>
              ))}

            </div>
          </section>

          <section className="dashboardSection">
            <h2>Applications</h2>

            {applications.length ? (
              <div className="applicationsQueue">
                {applications.map((application) => {
                  const job = application.JobListing;
                  const company = myCompanies.find(
                    (item) =>
                      item.id === application.companyId
                  );
                  const status =
                    application.status.toLowerCase();
                  const nextStatuses =
                    validApplicationTransitions[
                      status
                    ] || [];
                  const candidateName =
                    application.User
                      ? `${application.User.firstName} ${application.User.lastName}`
                      : "Candidate";

                  return (
                    <article
                      className="applicationCard"
                      key={application.id}
                    >
                      <div className="applicationTopline">
                        <div>
                          <h3>{candidateName}</h3>
                          <p>
                            Applied for{" "}
                            <strong>
                              {job?.title || "Job"}
                            </strong>
                          </p>
                          <small>
                            {company?.name ||
                              "Company"}
                          </small>
                        </div>

                        <span
                          className={`statusBadge status-${status}`}
                        >
                          {formatStatus(status)}
                        </span>
                      </div>

                      {application.resumeUrl && (
                        <a
                          className="resumeLink"
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View resume
                        </a>
                      )}

                      {application.coverLetter && (
                        <p
                          className="cardDescription"
                          title={
                            application.coverLetter
                          }
                        >
                          {application.coverLetter}
                        </p>
                      )}

                      <div className="applicationActions">
                        {nextStatuses.length ? (
                          nextStatuses.map(
                            (nextStatus) => (
                              <button
                                key={nextStatus}
                                onClick={() =>
                                  handleUpdateApplicationStatus(
                                    application.id,
                                    nextStatus
                                  )
                                }
                                disabled={
                                  updatingApplicationId ===
                                  application.id
                                }
                              >
                                Move to{" "}
                                {formatStatus(
                                  nextStatus
                                )}
                              </button>
                            )
                          )
                        ) : (
                          <span className="terminalStatus">
                            Final status
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="dashboardCard">
                <p>No applications yet.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="candidateLayout">
          <aside className="candidateJobList">
            <div className="candidateListHeader">
              <h2>Jobs for you</h2>
              <p>{jobs.length} active roles</p>
            </div>

            <div className="jobSearchBar">
            <input
              type="text"
              placeholder="Search jobs, skills, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

            <div className="candidateListScroller">
                       {isSearching ? (
              <JobCardSkeletonList />
            ) : (
              jobs.map((job) => {
                const isSelected =
                  selectedJob?.id === job.id;
                const isApplied =
                  appliedJobIds.has(job.id);

                return (
                  <button
                    className={`candidateJobItem ${
                      isSelected ? "active" : ""
                    }`}
                    key={job.id}
                    onClick={() =>
                      setSelectedJob(job)
                    }
                  >
                    <div>
                      <h3>{job.title}</h3>
                      <p>
                        {job.Company?.name ||
                          "Company"}
                      </p>
                    </div>

                    <p
                      className="cardDescription"
                      title={job.description}
                    >
                      {job.description}
                    </p>

                    <div className="jobMeta">
                      {job.location && (
                        <span className="metaPill metaLocation">
                          {job.location}
                        </span>
                      )}
                      <span className="metaPill metaSalary">
                        {formatSalary(job)}
                      </span>
                      {job.employmentType && (
                        <span className="metaPill metaType">
                          {job.employmentType}
                        </span>
                      )}
                    </div>

                    {isApplied && (
                      <strong className="appliedBadge">
                        Applied
                      </strong>
                    )}
                  </button>
                );
              })

            )}
            </div>
          </aside>

          <article className="candidateJobDetails">
            {selectedJob && !isSearching ? (
              <>
                <div className="detailsHeader">
                  <div>
                    <h2>{selectedJob.title}</h2>
                    <p>
                      {selectedJob.Company?.name ||
                        "Company"}
                    </p>
                  </div>

                  <strong>
                    {appliedJobIds.has(selectedJob.id)
                      ? "Applied"
                      : "Open"}
                  </strong>
                </div>

                <div className="jobMeta detailsMeta">
                  {selectedJob.location && (
                    <span className="metaPill metaLocation">
                      {selectedJob.location}
                    </span>
                  )}
                  <span className="metaPill metaSalary">
                    {formatSalary(selectedJob)}
                  </span>
                  {selectedJob.employmentType && (
                    <span className="metaPill metaType">
                      {selectedJob.employmentType}
                    </span>
                  )}
                </div>

                <div className="detailsBlock">
                  <h3>Job Details</h3>
                  <p>{selectedJob.description}</p>
                </div>

                <form
                  className="applyForm"
                  onSubmit={applicationForm.handleSubmit(
                    handleApply
                  )}
                >
                  <h3>Apply for this job</h3>

                  <input
                    type="url"
                    placeholder="Resume URL"
                    {...applicationForm.register(
                      "resumeUrl"
                    )}
                    disabled={appliedJobIds.has(
                      selectedJob.id
                    )}
                  />

                  <textarea
                    placeholder="Cover letter"
                    {...applicationForm.register(
                      "coverLetter"
                    )}
                    disabled={appliedJobIds.has(
                      selectedJob.id
                    )}
                  />

                  <button
                    type="submit"
                    disabled={
                      applying ||
                      appliedJobIds.has(selectedJob.id)
                    }
                  >
                    {appliedJobIds.has(selectedJob.id)
                      ? "Already Applied"
                      : applying
                      ? "Applying..."
                      : "Apply Now"}
                  </button>
                </form>
              </>
            ) : (
               <JobDetailsSkeleton />
              // <p>Select a job to view details.</p>
            )}
          </article>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
