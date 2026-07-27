import "./JobCard.css";
import { formatSalary } from "../../utils/dashboard.utils";
import { Badge } from "../ui";

const JobCard = ({ job, isSelected, isApplied, setSelectedJob }) => {
  return (
    <button
      className={`candidateJobItem ${isSelected ? "active" : ""}`}
      onClick={() => setSelectedJob(job)}
    >
      <div className="candidateJobItem__title-row">
        <div>
          <h3>{job.title}</h3>
          <p>{job.Company?.name || "Company"}</p>
        </div>
        {isApplied && (
          <Badge variant="green" size="sm">
            Applied
          </Badge>
        )}
      </div>

      <p className="cardDescription" title={job.description}>
        {job.description}
      </p>

      <div className="jobMeta">
        {job.location && <span className="metaPill metaLocation">{job.location}</span>}
        <span className="metaPill metaSalary">{formatSalary(job)}</span>
        {job.employmentType && <span className="metaPill metaType">{job.employmentType}</span>}
      </div>
    </button>
  );
};

export default JobCard;
