import { JobDetailsSkeleton } from "../skeletons/JobDetailsSkeleton";
import VirtualizedJobList from "../jobs/VirtualizedJobList";
import { useDashboard } from "../../hooks/useDashboard";
import { formatSalary } from "../../utils/dashboard.utils";

const CandidateDashboard = () => {
  const {
    jobs,
    searchTerm, setSearchTerm,
    selectedJob,
    appliedJobIds,
    isSearching,
    applicationForm,
    handleApply,
    applying,
  } = useDashboard();
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

          <VirtualizedJobList />
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
