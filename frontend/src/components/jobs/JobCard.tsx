import "./JobCard.css";

import type { Job } from "../../types";

const JobCard = ({ job }: { job: Job }) => {
  const salary =
    job.salaryMin || job.salaryMax
      ? `${job.salaryMin || "Open"} - ${
          job.salaryMax || "Open"
        }`
      : "Salary open";

  return (
    <div className="jobCard">
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
          {salary}
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
  );
};

export default JobCard;
