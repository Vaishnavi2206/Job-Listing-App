import { JobDetailsSkeleton } from "../skeletons/JobDetailsSkeleton";
import VirtualizedJobList from "../jobs/VirtualizedJobList";
import { useDashboard } from "../../hooks/useDashboard";
import { useJobs } from "../../hooks/useJobs";
import { formatSalary } from "../../utils/dashboard.utils";
import { Button, Input, Textarea, FormField, Badge, EmptyState } from "../ui";

const CandidateDashboard = () => {
  const { appliedJobIds, applicationForm, handleApply, applying } = useDashboard();
  const { jobs, searchTerm, setSearchTerm, selectedJob, isSearching } = useJobs();

  return (
    <div className="db-candidate-layout">
      {/* ── Job List ──────────────────────────────────────────── */}
      <aside className="db-job-list">
        <div className="db-job-list__header">
          <h2>Jobs for you</h2>
          <p>{jobs.length} active roles</p>
        </div>

        <div className="db-job-list__search">
          <Input
            size="sm"
            placeholder="Search jobs, skills, company…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <VirtualizedJobList />
      </aside>

      {/* ── Job Details ───────────────────────────────────────── */}
      <article className="db-job-details">
        {selectedJob && !isSearching ? (
          <>
            <div className="db-job-details__header">
              <div>
                <h2>{selectedJob.title}</h2>
                <p>{selectedJob.Company?.name || "Company"}</p>
              </div>
              <Badge variant={appliedJobIds.has(selectedJob.id) ? "green" : "blue"}>
                {appliedJobIds.has(selectedJob.id) ? "Applied" : "Open"}
              </Badge>
            </div>

            <div className="db-job-details__meta">
              {selectedJob.location && (
                <span className="metaPill metaLocation">{selectedJob.location}</span>
              )}
              <span className="metaPill metaSalary">{formatSalary(selectedJob)}</span>
              {selectedJob.employmentType && (
                <span className="metaPill metaType">{selectedJob.employmentType}</span>
              )}
            </div>

            <div className="db-job-details__body">
              <h3>Job Details</h3>
              <p>{selectedJob.description}</p>
            </div>

            <form
              className="db-apply-form"
              onSubmit={applicationForm.handleSubmit((data) => {
                if (selectedJob) handleApply(data, selectedJob.id);
              })}
            >
              <h3>Apply for this role</h3>

              <FormField label="Resume URL" htmlFor="apply-resume">
                <Input
                  id="apply-resume"
                  type="url"
                  placeholder="https://yourresume.com/cv.pdf"
                  {...applicationForm.register("resumeUrl")}
                  disabled={appliedJobIds.has(selectedJob.id)}
                />
              </FormField>

              <FormField label="Cover letter" htmlFor="apply-cover">
                <Textarea
                  id="apply-cover"
                  placeholder="Tell them why you're a great fit…"
                  {...applicationForm.register("coverLetter")}
                  disabled={appliedJobIds.has(selectedJob.id)}
                />
              </FormField>

              <Button
                type="submit"
                variant={appliedJobIds.has(selectedJob.id) ? "secondary" : "primary"}
                loading={applying}
                disabled={applying || appliedJobIds.has(selectedJob.id)}
              >
                {appliedJobIds.has(selectedJob.id)
                  ? "Already Applied"
                  : applying
                    ? "Applying…"
                    : "Apply Now"}
              </Button>
            </form>
          </>
        ) : isSearching ? (
          <JobDetailsSkeleton />
        ) : (
          <div className="db-job-details__empty">
            <EmptyState
              title="Select a job"
              message="Click on a job from the list to view details and apply."
            />
          </div>
        )}
      </article>
    </div>
  );
};

export default CandidateDashboard;
