import { useMemo } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import { useJobs } from "../../hooks/useJobs";
import {
  formatSalary,
  formatStatus,
  validApplicationTransitions,
} from "../../utils/dashboard.utils";
import { Button, Input, Select, Textarea, FormField, Badge, EmptyState } from "../ui";
import { statusToBadgeVariant } from "../ui/Badge";

const EmployerDashboard = () => {
  const {
    companyForm,
    jobForm,
    myCompanies,
    applications,
    handleCreateCompany,
    handleCreateJob,
    updatingApplicationId,
    handleUpdateApplicationStatus,
  } = useDashboard();
  const { jobs, reloadJobs } = useJobs();

  const myJobs = useMemo(
    () => jobs.filter((job) => myCompanies.some((c) => c.id === job.companyId)),
    [jobs, myCompanies]
  );

  const pendingCount = applications.filter((a) => a.status.toLowerCase() === "pending").length;

  const onCreateJobSubmit = jobForm.handleSubmit(async (data) => {
    try {
      await handleCreateJob(data);
      await reloadJobs();
    } catch {
      // error already set in context
    }
  });

  return (
    <div id="overview">
      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="db-stats">
        <div className="db-stat-card">
          <div className="db-stat-card__icon">🏢</div>
          <div>
            <div className="db-stat-card__value">{myCompanies.length}</div>
            <div className="db-stat-card__label">Companies</div>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-card__icon">💼</div>
          <div>
            <div className="db-stat-card__value">{myJobs.length}</div>
            <div className="db-stat-card__label">Active Jobs</div>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-card__icon">📋</div>
          <div>
            <div className="db-stat-card__value">{applications.length}</div>
            <div className="db-stat-card__label">Applications</div>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-card__icon">⏳</div>
          <div>
            <div className="db-stat-card__value">{pendingCount}</div>
            <div className="db-stat-card__label">Pending Review</div>
          </div>
        </div>
      </div>

      {/* ── Create Forms ──────────────────────────────────────── */}
      <div className="db-forms-grid">
        {/* Create Company */}
        <div className="db-form-card">
          <h2 className="db-form-card__title">Create Company</h2>
          <form className="db-form" onSubmit={companyForm.handleSubmit(handleCreateCompany)}>
            <FormField label="Company name" required htmlFor="co-name">
              <Input
                id="co-name"
                placeholder="Acme Corp"
                {...companyForm.register("name", { required: true })}
              />
            </FormField>

            <FormField label="Description" htmlFor="co-desc">
              <Textarea
                id="co-desc"
                placeholder="What does your company do?"
                {...companyForm.register("description")}
              />
            </FormField>

            <FormField label="Team size" htmlFor="co-size">
              <Input
                id="co-size"
                placeholder="e.g. 50–200"
                {...companyForm.register("employeeSize")}
              />
            </FormField>

            <FormField label="Location" htmlFor="co-location">
              <Input
                id="co-location"
                placeholder="City, Country"
                {...companyForm.register("location")}
              />
            </FormField>

            <FormField label="Category" htmlFor="co-category">
              <Input
                id="co-category"
                placeholder="e.g. SaaS, FinTech"
                {...companyForm.register("category")}
              />
            </FormField>

            <Button type="submit" variant="primary" fullWidth>
              Create Company
            </Button>
          </form>
        </div>

        {/* Create Job */}
        <div className="db-form-card">
          <h2 className="db-form-card__title">Create Job</h2>
          <form className="db-form" onSubmit={onCreateJobSubmit}>
            <FormField label="Company" required htmlFor="job-company">
              <Select
                id="job-company"
                placeholder="Select company"
                options={myCompanies.map((c) => ({ value: c.id, label: c.name }))}
                {...jobForm.register("companyId", { required: true })}
              />
            </FormField>

            <FormField label="Job title" required htmlFor="job-title">
              <Input
                id="job-title"
                placeholder="e.g. Senior Engineer"
                {...jobForm.register("title", { required: true })}
              />
            </FormField>

            <FormField label="Description" required htmlFor="job-desc">
              <Textarea
                id="job-desc"
                placeholder="Describe the role and requirements…"
                {...jobForm.register("description", { required: true })}
              />
            </FormField>

            <FormField label="Location" htmlFor="job-location">
              <Input
                id="job-location"
                placeholder="Remote / City, Country"
                {...jobForm.register("location")}
              />
            </FormField>

            <div className="db-form-row">
              <FormField label="Min salary" htmlFor="job-min">
                <Input
                  id="job-min"
                  type="number"
                  placeholder="60,000"
                  {...jobForm.register("salaryMin")}
                />
              </FormField>
              <FormField label="Max salary" htmlFor="job-max">
                <Input
                  id="job-max"
                  type="number"
                  placeholder="100,000"
                  {...jobForm.register("salaryMax")}
                />
              </FormField>
            </div>

            <FormField label="Employment type" htmlFor="job-type">
              <Select
                id="job-type"
                placeholder="Select type"
                options={[
                  { value: "Full Time", label: "Full Time" },
                  { value: "Part Time", label: "Part Time" },
                  { value: "Contract", label: "Contract" },
                  { value: "Internship", label: "Internship" },
                ]}
                {...jobForm.register("employmentType")}
              />
            </FormField>

            <Button type="submit" variant="primary" fullWidth disabled={!myCompanies.length}>
              Create Job
            </Button>
          </form>
        </div>
      </div>

      {/* ── Companies ─────────────────────────────────────────── */}
      <section className="db-section" id="companies">
        <div className="db-section__header">
          <h2 className="db-section__title">Your Companies</h2>
          <Badge variant="neutral">{myCompanies.length}</Badge>
        </div>

        {myCompanies.length ? (
          <div className="db-cards-grid">
            {myCompanies.map((company) => (
              <div className="db-entity-card" key={company.id}>
                <div className="db-entity-card__header">
                  <div className="db-entity-card__header-left">
                    <div className="db-entity-card__avatar">{company.name[0].toUpperCase()}</div>
                    <div>
                      <h3 className="db-entity-card__name">{company.name}</h3>
                      {company.category && (
                        <span className="db-entity-card__sub">{company.category}</span>
                      )}
                    </div>
                  </div>
                </div>

                {company.description && (
                  <p className="db-entity-card__description" title={company.description}>
                    {company.description}
                  </p>
                )}

                <div className="db-entity-card__meta">
                  {company.location && (
                    <span className="metaPill metaLocation">{company.location}</span>
                  )}
                  {company.employeeSize && (
                    <span className="metaPill metaSalary">{company.employeeSize}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No companies yet"
            message="Create your first company above to start posting jobs."
            compact
          />
        )}
      </section>

      {/* ── Jobs ──────────────────────────────────────────────── */}
      <section className="db-section" id="jobs">
        <div className="db-section__header">
          <h2 className="db-section__title">Your Jobs</h2>
          <Badge variant="neutral">{myJobs.length}</Badge>
        </div>

        {myJobs.length ? (
          <div className="db-cards-grid">
            {myJobs.map((job) => (
              <div className="db-entity-card" key={job.id}>
                <div className="db-entity-card__header">
                  <div className="db-entity-card__header-left">
                    <div>
                      <h3 className="db-entity-card__name">{job.title}</h3>
                      <span className="db-entity-card__sub">{job.Company?.name}</span>
                    </div>
                  </div>
                  {job.employmentType && <Badge variant="blue">{job.employmentType}</Badge>}
                </div>

                {job.description && (
                  <p className="db-entity-card__description" title={job.description}>
                    {job.description}
                  </p>
                )}

                <div className="db-entity-card__meta">
                  {job.location && <span className="metaPill metaLocation">{job.location}</span>}
                  <span className="metaPill metaSalary">{formatSalary(job)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No jobs posted yet"
            message="Create a company first, then post your first job listing."
            compact
          />
        )}
      </section>

      {/* ── Applications ──────────────────────────────────────── */}
      <section className="db-section" id="applications">
        <div className="db-section__header">
          <h2 className="db-section__title">Applications</h2>
          <Badge variant={pendingCount > 0 ? "orange" : "neutral"}>{applications.length}</Badge>
        </div>

        {applications.length ? (
          <div className="db-apps-grid">
            {applications.map((application) => {
              const job = application.JobListing;
              const company = myCompanies.find((item) => item.id === application.companyId);
              const status = application.status.toLowerCase();
              const nextStatuses = validApplicationTransitions[status] || [];
              const candidateName = application.User
                ? `${application.User.firstName} ${application.User.lastName}`
                : "Candidate";

              return (
                <article className="db-app-card" key={application.id}>
                  <div className="db-app-card__header">
                    <div>
                      <h3 className="db-app-card__name">{candidateName}</h3>
                      <p className="db-app-card__job">
                        Applied for <strong>{job?.title || "Job"}</strong>
                      </p>
                      <p className="db-app-card__company">{company?.name || "Company"}</p>
                    </div>
                    <Badge variant={statusToBadgeVariant(status)}>{formatStatus(status)}</Badge>
                  </div>

                  {application.resumeUrl && (
                    <a
                      className="db-app-card__resume"
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Resume →
                    </a>
                  )}

                  {application.coverLetter && (
                    <p className="db-app-card__letter" title={application.coverLetter}>
                      {application.coverLetter}
                    </p>
                  )}

                  <div className="db-app-card__actions">
                    {nextStatuses.length ? (
                      nextStatuses.map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateApplicationStatus(application.id, nextStatus)}
                          disabled={updatingApplicationId === application.id}
                          loading={updatingApplicationId === application.id}
                        >
                          {formatStatus(nextStatus)}
                        </Button>
                      ))
                    ) : (
                      <span className="terminalStatus">Final status</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No applications yet"
            message="Applications will appear here once candidates apply to your jobs."
            compact
          />
        )}
      </section>
    </div>
  );
};

export default EmployerDashboard;
