import './JobCardSkeleton.css';
export const JobDetailsSkeleton = () => (
  <div>
    <div className="skeletonTitle" />
    <div className="skeletonCompany" />

    <div
      style={{
        height: 150,
        background: "#e5e7eb",
        borderRadius: 8,
        marginTop: 20,
      }}
    />
  </div>
);