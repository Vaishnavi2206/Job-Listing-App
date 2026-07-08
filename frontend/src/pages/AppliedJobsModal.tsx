import * as React from 'react';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';

const emails = ['username@gmail.com', 'user02@gmail.com'];

export interface SimpleDialogProps {
  open: boolean;
  selectedValue: string;
  onClose: (value: string) => void;
}

export default function AppliedJobsModal({applications,getApplicationJob,setSelectedJob, setShowAppliedJobs}: any) {
//   const { onClose, selectedValue, open } = props;
const [open, setOpen] = React.useState(true);
  const [selectedValue, setSelectedValue] = React.useState(emails[1]);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = (value: string) => {
    setOpen(false);
    setSelectedValue(value);
  };

//   const handleListItemClick = (value: string) => {
//     onClose(value);
//   };

  return (
    <Dialog onClose={handleClose} open={open}>
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
