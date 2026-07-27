import { useEffect } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useJobs } from "../hooks/useJobs";
import { getApplicationJob } from "../utils/dashboard.utils";
import { Badge } from "../components/ui";
import { statusToBadgeVariant } from "../components/ui/Badge";

export default function AppliedJobsModal() {
  const { applications, setShowAppliedJobs } = useDashboard();
  const { jobs, setSelectedJob } = useJobs();

  const handleClose = () => {
    setShowAppliedJobs(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="db-modal-overlay" onClick={handleClose}>
      <div
        className="db-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="applied-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="db-modal__header">
          <h2 className="db-modal__title" id="applied-modal-title">
            Applied Jobs
          </h2>
          <button className="db-modal__close" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="db-modal__body">
          {applications.length ? (
            <div className="db-applied-list">
              {applications.map((application) => {
                const job = getApplicationJob(application);
                return (
                  <button
                    className="db-applied-item"
                    key={application.id}
                    onClick={() => {
                      const listedJob = jobs.find(
                        (availableJob) => availableJob.id === application.jobListingId
                      );
                      if (listedJob || job) {
                        setSelectedJob(listedJob || job || null);
                      }
                      setShowAppliedJobs(false);
                    }}
                  >
                    <div className="db-applied-item__info">
                      <span className="db-applied-item__title">{job?.title || "Job"}</span>
                      <span className="db-applied-item__company">
                        {application.Company?.name || job?.Company?.name || "Company"}
                      </span>
                    </div>
                    <Badge
                      variant={statusToBadgeVariant(application.status.toLowerCase())}
                      size="sm"
                    >
                      {application.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="db-applied-empty">No applications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
