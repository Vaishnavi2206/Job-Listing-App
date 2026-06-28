import React from "react";
import "./JobCard.css";

const JobCard = ({
  job,
  isSelected,
  isApplied,
  setSelectedJob,
  formatSalary,
}) => {
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
          <span className="metaPill metaLocation">{job.location}</span>
        )}
        <span className="metaPill metaSalary">{formatSalary(job)}</span>
        {job.employmentType && (
          <span className="metaPill metaType">{job.employmentType}</span>
        )}
      </div>

      {isApplied && <strong className="appliedBadge">Applied</strong>}
    </button>
  );
};

export default JobCard;
