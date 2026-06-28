const EmployerDashboard = ({
  companyForm,
  myCompanies,
  myJobs,
  applications,
  jobForm,
  handleCreateCompany,
  handleCreateJob,
  formatSalary,
  validApplicationTransitions,
  formatStatus,
  updatingApplicationId,
  handleUpdateApplicationStatus
}) => {
  console.log("formatSalary", formatSalary);
  return (
    <div>
      <section className="dashboardGrid">
        <div className="dashboardCard">
          <h2>Create Company</h2>

          <form onSubmit={companyForm.handleSubmit(handleCreateCompany)}>
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

            <button type="submit">Create Company</button>
          </form>
        </div>

        <div className="dashboardCard">
          <h2>Create Job</h2>

          <form onSubmit={jobForm.handleSubmit(handleCreateJob)}>
            <select
              {...jobForm.register("companyId", {
                required: true,
              })}
            >
              <option value="">Select company</option>

              {myCompanies.map((company) => (
                <option key={company.id} value={company.id}>
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

            <select {...jobForm.register("employmentType")}>
              <option value="">Employment type</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            <button type="submit" disabled={!myCompanies.length}>
              Create Job
            </button>
          </form>
        </div>
      </section>

      <section className="dashboardSection">
        <h2>Your Companies</h2>

        <div className="jobsGrid listingGrid">
          {myCompanies.map((company) => (
            <div className="jobCard" key={company.id}>
              <h3>{company.name}</h3>
              <p className="cardDescription" title={company.description}>
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
                  <span className="metaPill metaType">{company.category}</span>
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
            <div className="jobCard" key={job.id}>
              <h3>{job.title}</h3>
              <p className="cardDescription" title={job.description}>
                {job.description}
              </p>
              <div className="jobMeta">
                {job.location && (
                  <span className="metaPill metaLocation">{job.location}</span>
                )}
                <span className="metaPill metaSalary">{formatSalary(job)}</span>
                {job.employmentType && (
                  <span className="metaPill metaType">
                    {job.employmentType}
                  </span>
                )}
              </div>
              <div className="companyName">{job.Company?.name}</div>
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
                (item) => item.id === application.companyId,
              );
              const status = application.status.toLowerCase();
              const nextStatuses = validApplicationTransitions[status] || [];
              const candidateName = application.User
                ? `${application.User.firstName} ${application.User.lastName}`
                : "Candidate";

              return (
                <article className="applicationCard" key={application.id}>
                  <div className="applicationTopline">
                    <div>
                      <h3>{candidateName}</h3>
                      <p>
                        Applied for <strong>{job?.title || "Job"}</strong>
                      </p>
                      <small>{company?.name || "Company"}</small>
                    </div>

                    <span className={`statusBadge status-${status}`}>
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
                      title={application.coverLetter}
                    >
                      {application.coverLetter}
                    </p>
                  )}

                  <div className="applicationActions">
                    {nextStatuses.length ? (
                      nextStatuses.map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() =>
                            handleUpdateApplicationStatus(
                              application.id,
                              nextStatus,
                            )
                          }
                          disabled={updatingApplicationId === application.id}
                        >
                          Move to {formatStatus(nextStatus)}
                        </button>
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
          <div className="dashboardCard">
            <p>No applications yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default EmployerDashboard;
