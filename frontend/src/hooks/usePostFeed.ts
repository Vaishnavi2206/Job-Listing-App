import { useCallback, useEffect, useState } from "react";
import { getAllPosts } from "../services/posts.service";
import type { Post } from "../types";

const PAGE_SIZE = 10;

export const usePostFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    try {
      const data = await getAllPosts({ limit: PAGE_SIZE });
      setPosts(data.posts);
      setNextCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasMore);
      setError(null);
    } catch {
      setError("Failed to load posts.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadInitial();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;

    try {
      setLoadingMore(true);
      const data = await getAllPosts({
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });

      setPosts((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const uniqueNew = data.posts.filter((item) => !seen.has(item.id));
        return [...prev, ...uniqueNew];
      });
      setNextCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasMore);
    } catch {
      setError("Failed to load more posts.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor]);

  const prependPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  }, []);

  return {
    posts,
    initialLoading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    prependPost,
    reload: loadInitial,
  };
};
