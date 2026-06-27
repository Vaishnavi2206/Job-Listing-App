import React from "react";
import { JobDetailsSkeleton } from "../skeletons/JobDetailsSkeleton";

const CandidateDashboard = ({
  jobs,
  searchTerm,
  setSearchTerm,
  selectedJob,
  setSelectedJob,
  appliedJobIds,
  isSearching,
  applicationForm,
  handleApply,
  formatSalary,
  applying,
}) => {
  return (
    <div>
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
              <JobDetailsSkeleton />
            ) : (
              jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const isApplied = appliedJobIds.has(job.id);

                return (
                  <button
                    className={`candidateJobItem ${isSelected ? "active" : ""}`}
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div>
                      <h3>{job.title}</h3>
                      <p>{job.Company?.name || "Company"}</p>
                    </div>

                    <p className="cardDescription" title={job.description}>
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
                      <strong className="appliedBadge">Applied</strong>
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
                  <p>{selectedJob.Company?.name || "Company"}</p>
                </div>

                <strong>
                  {appliedJobIds.has(selectedJob.id) ? "Applied" : "Open"}
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
                onSubmit={applicationForm.handleSubmit(handleApply)}
              >
                <h3>Apply for this job</h3>

                <input
                  type="url"
                  placeholder="Resume URL"
                  {...applicationForm.register("resumeUrl")}
                  disabled={appliedJobIds.has(selectedJob.id)}
                />

                <textarea
                  placeholder="Cover letter"
                  {...applicationForm.register("coverLetter")}
                  disabled={appliedJobIds.has(selectedJob.id)}
                />

                <button
                  type="submit"
                  disabled={applying || appliedJobIds.has(selectedJob.id)}
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
    </div>
  );
};

export default CandidateDashboard;
