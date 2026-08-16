import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "../api/axios";
import { createPost, deletePost, getAllPosts, getPostById } from "./posts.service";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("posts.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a post and return nested data", async () => {
    const payload = { title: "Hello World", description: "A long description", authorId: "u1" };
    const data = { id: "p1", title: "Hello World" };
    vi.mocked(api.post).mockResolvedValue({ data: { data } } as any);

    const result = await createPost(payload as any);

    expect(api.post).toHaveBeenCalledWith("/posts", payload);
    expect(result).toEqual(data);
  });

  it("should get paginated posts when backend returns pagination", async () => {
    const data = { posts: [{ id: "p1" }], pagination: { nextCursor: "c1", hasMore: true } };
    vi.mocked(api.get).mockResolvedValue({ data: { data } } as any);

    const result = await getAllPosts({ limit: 10, cursor: "c0" });

    expect(api.get).toHaveBeenCalledWith("/posts", { params: { limit: 10, cursor: "c0" } });
    expect(result).toEqual(data);
  });

  it("should normalize legacy posts response without pagination", async () => {
    const legacy = { posts: [{ id: "p2" }] };
    vi.mocked(api.get).mockResolvedValue({ data: { data: legacy } } as any);

    const result = await getAllPosts();

    expect(result).toEqual({
      posts: [{ id: "p2" }],
      pagination: { nextCursor: null, hasMore: false },
    });
  });

  it("should get post by id", async () => {
    const data = { id: "p3" };
    vi.mocked(api.get).mockResolvedValue({ data: { data } } as any);

    const result = await getPostById("p3");

    expect(api.get).toHaveBeenCalledWith("/posts/p3");
    expect(result).toEqual(data);
  });

  it("should delete post with default softDelete=true", async () => {
    vi.mocked(api.delete).mockResolvedValue({} as any);

    await deletePost("p4");

    expect(api.delete).toHaveBeenCalledWith("/posts/p4", {
      params: { softDelete: true },
    });
  });

  it("should delete post with softDelete=false when explicitly passed", async () => {
    vi.mocked(api.delete).mockResolvedValue({} as any);

    await deletePost("p5", false);

    expect(api.delete).toHaveBeenCalledWith("/posts/p5", {
      params: { softDelete: false },
    });
  });
});
