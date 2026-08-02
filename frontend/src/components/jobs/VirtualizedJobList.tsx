import { useEffect, useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import JobCard from "./JobCard";
import { JobDetailsSkeleton } from "../skeletons/JobDetailsSkeleton";
import { useJobs } from "../../hooks/useJobs";
import { useDashboard } from "../../hooks/useDashboard";

type VirtualizedListProps<T> = {
  items: T[];
  itemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  endReachedThreshold?: number;
  bottomLoader?: ReactNode;
  emptyState?: ReactNode;
  height?: string;
};

export const VirtualizedList = <T,>({
  items,
  itemKey,
  renderItem,
  estimateSize = 180,
  overscan = 8,
  className = "candidateListScroller",
  onEndReached,
  hasMore = false,
  isFetchingMore = false,
  endReachedThreshold = 5,
  bottomLoader = null,
  emptyState = null,
  height = "100%",
}: VirtualizedListProps<T>) => {
  "use no memo"; // useVirtualizer is incompatible with React Compiler memoization
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadTriggeredRef = useRef(false);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!onEndReached || isFetchingMore || !hasMore) return;
    if (virtualItems.length === 0) return;

    const lastVisible = virtualItems[virtualItems.length - 1].index;
    const shouldLoad = lastVisible >= items.length - endReachedThreshold;

    if (shouldLoad && !loadTriggeredRef.current) {
      loadTriggeredRef.current = true;
      onEndReached();
    }

    if (!shouldLoad) {
      loadTriggeredRef.current = false;
    }
  }, [endReachedThreshold, hasMore, isFetchingMore, items.length, onEndReached, virtualItems]);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        overflowY: "auto",
        height,
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
          const item = items[virtualRow.index];

          if (!item) return null;

          return (
            <div
              key={itemKey(item, virtualRow.index)}
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
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>

      {isFetchingMore && bottomLoader}
    </div>
  );
};

const VirtualizedJobList = () => {
  const { jobs, selectedJob, setSelectedJob, isSearching, loadingMore, hasMore, loadMoreJobs } =
    useJobs();
  const { appliedJobIds } = useDashboard();

  if (isSearching) {
    return <JobDetailsSkeleton />;
  }

  return (
    <VirtualizedList
      items={jobs}
      itemKey={(job) => job.id}
      renderItem={(job) => (
        <JobCard
          job={job}
          isSelected={selectedJob?.id === job.id}
          isApplied={appliedJobIds.has(job.id)}
          setSelectedJob={setSelectedJob}
        />
      )}
      estimateSize={180}
      overscan={8}
      endReachedThreshold={5}
      hasMore={hasMore}
      isFetchingMore={loadingMore}
      onEndReached={loadMoreJobs}
      bottomLoader={
        <div style={{ padding: "16px 0" }}>
          <JobDetailsSkeleton />
        </div>
      }
    />
  );
};

export default VirtualizedJobList;
