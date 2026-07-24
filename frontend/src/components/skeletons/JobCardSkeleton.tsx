import "./JobCardSkeleton.css";

export const JobCardSkeleton = () => (
  <div className="jobSkeleton">
    <div className="skeletonTitle" />
    <div className="skeletonCompany" />
    <div className="skeletonLocation" />
    <div className="skeletonTags">
      <span />
      <span />
      <span />
    </div>
  </div>
);
