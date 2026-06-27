import { useCallback, useEffect, useState } from "react";
import { getJobs } from "../services/jobs.service";
import type { Job } from "../types";

interface UseJobsOptions {
  pageSize?: number;
}

export default function useJobs({
  pageSize = 10,
}: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] =
    useState<Job | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [isSearching, setIsSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  /**
   * Future Ready
   */
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] =
    useState(true);

  /**
   * Load jobs
   */
  const fetchJobs = useCallback(
    async (
      pageNo = 1,
      search = "",
      replace = true
    ) => {
      try {
        if (replace) {
          setLoading(true);
        } else {
          setIsSearching(true);
        }

        const response = await getJobs(
          pageSize,
          pageNo,
          search
        );

        if (replace) {
          setJobs(response);

          /**
           * Don't lose selected job
           */
          setSelectedJob((current) => {
            if (!current && response.length) {
              return response[0];
            }

            const stillExists =
              response.find(
                (job) => job.id === current?.id
              );

            return (
              stillExists ||
              response[0] ||
              null
            );
          });
        } else {
          setJobs((prev) => [
            ...prev,
            ...response,
          ]);
        }

        /**
         * Placeholder
         * Will change once backend
         * supports pagination.
         */
        setHasMore(
          response.length === pageSize
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load jobs");
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [pageSize]
  );

  /**
   * Initial load
   */
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /**
   * Debounced search
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchJobs(1, searchTerm, true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, fetchJobs]);

  /**
   * Refresh after creating job
   */
  const refresh = () => {
    fetchJobs(page, searchTerm);
  };

  /**
   * Ready for future pagination
   */
  const loadMore = () => {
    const nextPage = page + 1;

    setPage(nextPage);

    fetchJobs(
      nextPage,
      searchTerm,
      false
    );
  };

  return {
    jobs,
    loading,
    isSearching,
    selectedJob,
    setSelectedJob,
    searchTerm,
    setSearchTerm,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}