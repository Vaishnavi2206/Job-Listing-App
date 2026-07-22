import { createContext, useState, useEffect, useRef, useCallback } from "react";
import type { Job } from "../types";
import { getJobs } from "../services/jobs.service";

export interface JobsContextValue {
  jobs: Job[];
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMoreJobs: () => Promise<void>;
  reloadJobs: () => Promise<void>;
}

const JobsContext = createContext<JobsContextValue | null>(null);
export default JobsContext;

export const JobsProvider = ({ children }: { children: React.ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const searchInitialized = useRef(false);

  const reloadJobs = useCallback(async () => {
    try {
      const data = await getJobs(10, null);
      setJobs(data.jobs);
      setNextCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasMore);
      setSelectedJob((prev) => prev || data.jobs[0] || null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    reloadJobs();
  }, [reloadJobs]);

  const loadMoreJobs = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    try {
      setLoadingMore(true);
      const data = await getJobs(10, nextCursor);
      setJobs((prev) => [...prev, ...data.jobs]);
      setNextCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor]);

  // Debounced search — replaces the list (not appends), skips the initial empty-string mount
  useEffect(() => {
    if (!searchInitialized.current) {
      searchInitialized.current = true;
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await getJobs(10, null, searchTerm);
        setJobs(data.jobs);
        setNextCursor(data.pagination.nextCursor);
        setHasMore(data.pagination.hasMore);
        setSelectedJob(data.jobs[0] ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <JobsContext.Provider
      value={{
        jobs, selectedJob, setSelectedJob,
        searchTerm, setSearchTerm,
        isSearching, loadingMore, hasMore,
        loadMoreJobs, reloadJobs,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};
