export type PostMedia = {
  id: string;
  postId: string;
  url: string;
  mimeType: string;
  mediaType: "image" | "video";
  filename: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  displayOrder: number;
  createdAt: string;
};

export type PostAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
};

export type Post = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  isActive: boolean;
  User?: PostAuthor;
  media: PostMedia[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePostMediaItem = {
  url: string;
  mimeType: string;
  mediaType: "image" | "video";
  filename: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  displayOrder?: number;
};

export type CreatePostPayload = {
  title: string;
  description: string;
  authorId: string;
  mediaItems?: CreatePostMediaItem[];
};

export type PaginatedPostsResponse = {
  posts: Post[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};
