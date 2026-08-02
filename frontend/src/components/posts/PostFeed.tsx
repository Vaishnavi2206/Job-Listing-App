import { useEffect } from "react";
import { Alert, EmptyState, Loader } from "../ui";
import { VirtualizedList } from "../jobs/VirtualizedJobList";
import { JobCardSkeleton } from "../skeletons/JobCardSkeleton";
import { JobCardSkeletonList } from "../skeletons/JobCardSkeletonList";
import { usePostFeed } from "../../hooks/usePostFeed";
import type { Post } from "../../types";
import PostCard from "./PostCard";
import "./PostFeed.css";

type PostFeedProps = {
  newPost?: Post | null;
};

const PostFeed = ({ newPost }: PostFeedProps) => {
  const { posts, initialLoading, loadingMore, hasMore, error, loadMore, prependPost } = usePostFeed();

  useEffect(() => {
    if (!newPost) return;
    prependPost(newPost);
  }, [newPost, prependPost]);

  if (initialLoading) {
    return (
      <div className="post-feed post-feed--skeleton">
        <JobCardSkeletonList />
      </div>
    );
  }

  return (
    <section className="post-feed">
      {error && <Alert variant="danger" message={error} compact />}

      <VirtualizedList
        items={posts}
        itemKey={(post) => post.id}
        renderItem={(post) => (
          <div className="post-feed__item">
            <PostCard post={post} />
          </div>
        )}
        estimateSize={420}
        overscan={5}
        endReachedThreshold={3}
        hasMore={hasMore}
        isFetchingMore={loadingMore}
        onEndReached={loadMore}
        className="post-feed__scroller"
        emptyState={
          <EmptyState title="No posts yet" message="Be the first one to create a post." />
        }
        bottomLoader={
          <div className="post-feed__loading-more">
            <JobCardSkeleton />
            <Loader inline size="sm" variant="muted" label="Loading more posts..." />
          </div>
        }
      />
    </section>
  );
};

export default PostFeed;
