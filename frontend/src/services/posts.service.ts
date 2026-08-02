import api from "../api/axios";
import type { Post, CreatePostPayload, PaginatedPostsResponse } from "../types";

type LegacyPostsResponse = {
  posts: Post[];
};

export const createPost = async (payload: CreatePostPayload): Promise<Post> => {
  const response = await api.post("/posts", payload);
  return response.data.data;
};

export const getAllPosts = async (params?: {
  limit?: number;
  cursor?: string;
}): Promise<PaginatedPostsResponse> => {
  const response = await api.get("/posts", { params });
  const data = response.data.data as PaginatedPostsResponse | LegacyPostsResponse;

  if ("pagination" in data && data.pagination) {
    return data;
  }

  return {
    posts: data.posts ?? [],
    pagination: {
      nextCursor: null,
      hasMore: false,
    },
  };
};

export const getPostById = async (id: string): Promise<Post> => {
  const response = await api.get(`/posts/${id}`);
  return response.data.data;
};

export const deletePost = async (
  id: string,
  softDelete = true
): Promise<void> => {
  await api.delete(`/posts/${id}`, { params: { softDelete } });
};
