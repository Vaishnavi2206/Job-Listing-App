import { JobCardSkeleton } from "./JobCardSkeleton";

export const JobCardSkeletonList = () => (
  <>
    {Array.from({ length: 8 }).map((_, index) => (
      <JobCardSkeleton key={index} />
    ))}
  </>
);
