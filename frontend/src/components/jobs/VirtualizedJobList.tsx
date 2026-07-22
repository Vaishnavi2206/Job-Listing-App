import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import JobCard from "./JobCard";
import { JobDetailsSkeleton } from "../skeletons/JobDetailsSkeleton";
import { useDashboard } from "../../hooks/useDashboard";
import { formatSalary } from "../../utils/dashboard.utils";

const VirtualizedJobList = () => {
  const {
    jobs,
    selectedJob, setSelectedJob,
    appliedJobIds,
    isSearching,
    loadingMore,
    hasMore,
    loadMoreJobs: loadMore,
  } = useDashboard();
  const parentRef = useRef(null);
  const loadTriggeredRef = useRef(false);

  const rowVirtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 8,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  // const lastItem = virtualItems[virtualItems.length - 1];

//   useEffect(() => {
//     if (!lastItem) return;

//     const isLastLoadedJob =
//       lastItem.index >= jobs.length - 1;

//       console.count("loadMoreJobs called");

// console.log({
//   loadingMore,
//   hasMore
// });
//     if (
//       isLastLoadedJob &&
//       hasMore &&
//       !loadingMore
//     ) {
//       loadMore();
//     }
//   }, [
//     lastItem,
//     jobs.length,
//     hasMore,
//     loadingMore,
//     loadMore,
//   ]);

useEffect(() => {
  if (loadingMore || !hasMore) return;

  if (virtualItems.length === 0) return;

  const lastVisible = virtualItems[virtualItems.length - 1].index;

  const shouldLoad = lastVisible >= jobs.length - 5;

  if (shouldLoad && !loadTriggeredRef.current) {
    loadTriggeredRef.current = true;
    loadMore();
  }

  if (!shouldLoad) {
    loadTriggeredRef.current = false;
  }
}, [
  virtualItems,
  jobs.length,
  hasMore,
  loadingMore,
  loadMore,
]);
  
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
                formatSalary={formatSalary}
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