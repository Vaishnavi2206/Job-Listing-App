import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { useDashboard } from '../hooks/useDashboard';
import { useJobs } from '../hooks/useJobs';
import { getApplicationJob } from '../utils/dashboard.utils';

export default function AppliedJobsModal() {
  const { applications, setShowAppliedJobs } = useDashboard();
  const { jobs, setSelectedJob } = useJobs();

  const handleClose = () => {
    setShowAppliedJobs(false);
  };

  return (
    <Dialog onClose={handleClose} open={true}>
      <DialogTitle>Applied Jobs</DialogTitle>

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
    </Dialog>
  );
}
