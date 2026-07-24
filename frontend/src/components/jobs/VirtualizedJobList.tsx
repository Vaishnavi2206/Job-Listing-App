import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import JobCard from "./JobCard";
import { JobDetailsSkeleton } from "../skeletons/JobDetailsSkeleton";
import { useJobs } from "../../hooks/useJobs";
import { useDashboard } from "../../hooks/useDashboard";

const VirtualizedJobList = () => {
  "use no memo"; // useVirtualizer is incompatible with React Compiler memoization
  const { jobs, selectedJob, setSelectedJob, isSearching, loadingMore, hasMore, loadMoreJobs } =
    useJobs();
  const { appliedJobIds } = useDashboard();
  const parentRef = useRef(null);
  const loadTriggeredRef = useRef(false);

  const rowVirtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 8,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (loadingMore || !hasMore) return;

    if (virtualItems.length === 0) return;

    const lastVisible = virtualItems[virtualItems.length - 1].index;

    const shouldLoad = lastVisible >= jobs.length - 5;

    if (shouldLoad && !loadTriggeredRef.current) {
      loadTriggeredRef.current = true;
      loadMoreJobs();
    }

    if (!shouldLoad) {
      loadTriggeredRef.current = false;
    }
  }, [virtualItems, jobs.length, hasMore, loadingMore, loadMoreJobs]);

  if (isSearching) {
    return <JobDetailsSkeleton />;
  }

  return (
    <div
      ref={parentRef}
      className="candidateListScroller"
      style={{
        overflowY: "auto",
        height: "100%",
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const job = jobs[virtualRow.index];

          if (!job) return null;

          const isSelected = selectedJob?.id === job.id;
          const isApplied = appliedJobIds.has(job.id);

          return (
            <div
              key={job.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <JobCard
                job={job}
                isSelected={isSelected}
                isApplied={isApplied}
                setSelectedJob={setSelectedJob}
              />
            </div>
          );
        })}
      </div>

      {loadingMore && (
        <div style={{ padding: "16px 0" }}>
          <JobDetailsSkeleton />
        </div>
      )}
    </div>
  );
};

export default VirtualizedJobList;
