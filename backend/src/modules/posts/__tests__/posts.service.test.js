"use strict";

// Explicit factories prevent sequelize.define() from returning undefined when config/db is mocked
jest.mock("../posts.model", () => ({ create: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() }));
jest.mock("../postMedia.model", () => ({ bulkCreate: jest.fn() }));
jest.mock("../../users/user.model", () => ({}));
jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");
jest.mock("../../../utils/cursor");
jest.mock("../../../config/db");
jest.mock("../../../models", () => ({}));

const Post = require("../posts.model");
const PostMedia = require("../postMedia.model");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { decodeCursor, encodeCursor } = require("../../../utils/cursor");
const sequelize = require("../../../config/db");

const { createPost, getAllPosts, getPostById, updatePost, deletePost } = require("../posts.service");
const { NotFoundError, ForbiddenError } = require("../../../shared/utils/errors");

const USER_ID = 3;
const POST_ID = "post-1";

const plainPost = {
  id: POST_ID,
  title: "Hello World",
  description: "A great post",
  createdBy: USER_ID,
  media: [],
};
const mockPost = {
  ...plainPost,
  toJSON: () => plainPost,
  update: jest.fn(),
  destroy: jest.fn(),
};

beforeEach(() => {
  jest.resetAllMocks();
  sequelize.escape = jest.fn((v) => `'${v}'`);
  sequelize.literal = jest.fn((sql) => ({ sql }));
  decodeCursor.mockReturnValue(null);
  encodeCursor.mockReturnValue(null);
  getSignedUrl.mockResolvedValue("https://signed.url/key");
});

// ─── createPost ───────────────────────────────────────────────────────────────

describe("createPost", () => {
  const payload = {
    title: "Hello World",
    description: "A great post about coding",
    authorId: "auth-1",
  };

  it("should create a post with no media and return it", async () => {
    Post.create.mockResolvedValue({ id: POST_ID });
    Post.findByPk.mockResolvedValue(mockPost);

    const result = await createPost(payload);

    expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({ title: payload.title }));
    expect(PostMedia.bulkCreate).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: POST_ID });
  });

  it("should bulkCreate media items when mediaItems are provided", async () => {
    const media = [{ url: "key/img.jpg", mimeType: "image/jpeg", mediaType: "image", filename: "img.jpg" }];
    Post.create.mockResolvedValue({ id: POST_ID });
    PostMedia.bulkCreate.mockResolvedValue(undefined);
    Post.findByPk.mockResolvedValue(mockPost);

    await createPost({ ...payload, mediaItems: media });

    expect(PostMedia.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ postId: POST_ID })])
    );
  });

  it("should assign displayOrder from index when not provided in media item", async () => {
    const media = [
      { url: "a.jpg", mimeType: "image/jpeg", mediaType: "image", filename: "a.jpg" },
      { url: "b.jpg", mimeType: "image/jpeg", mediaType: "image", filename: "b.jpg" },
    ];
    Post.create.mockResolvedValue({ id: POST_ID });
    PostMedia.bulkCreate.mockResolvedValue(undefined);
    Post.findByPk.mockResolvedValue(mockPost);

    await createPost({ ...payload, mediaItems: media });

    const [records] = PostMedia.bulkCreate.mock.calls[0];
    expect(records[0].displayOrder).toBe(0);
    expect(records[1].displayOrder).toBe(1);
  });
});

// ─── getAllPosts ──────────────────────────────────────────────────────────────

describe("getAllPosts", () => {
  it("should return posts with hasMore=false when results fit within limit", async () => {
    Post.findAll.mockResolvedValue([mockPost]);

    const result = await getAllPosts({ limit: 10 });

    expect(result).toMatchObject({ pagination: { hasMore: false, nextCursor: null } });
    expect(result.posts).toHaveLength(1);
  });

  it("should return hasMore=true and nextCursor when there are more results", async () => {
    const now = new Date();
    const posts = Array.from({ length: 11 }, (_, i) => ({
      id: `p${i}`,
      createdAt: now,
      toJSON: () => ({ id: `p${i}`, createdAt: now, media: [] }),
    }));
    Post.findAll.mockResolvedValue(posts);
    encodeCursor.mockReturnValue("cursor-token");

    const result = await getAllPosts({ limit: 10 });

    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBe("cursor-token");
    expect(result.posts).toHaveLength(10);
  });

  it("should apply cursor WHERE clause when cursor is provided", async () => {
    decodeCursor.mockReturnValue({ createdAt: "2024-01-01", id: "p0" });
    Post.findAll.mockResolvedValue([]);

    await getAllPosts({ limit: 10, cursor: "some-cursor" });

    expect(Post.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    );
  });
});

// ─── getPostById ──────────────────────────────────────────────────────────────

describe("getPostById", () => {
  it("should return the post when found", async () => {
    Post.findByPk.mockResolvedValue(mockPost);

    const result = await getPostById(POST_ID);

    expect(result).toMatchObject({ id: POST_ID });
  });

  it("should throw NotFoundError when post does not exist", async () => {
    Post.findByPk.mockResolvedValue(null);

    await expect(getPostById("missing")).rejects.toThrow(NotFoundError);
    await expect(getPostById("missing")).rejects.toThrow("Post not found");
  });

  it("should sign media URLs when post has media", async () => {
    const postWithMedia = {
      ...plainPost,
      media: [{ url: "bucket/img.jpg", mimeType: "image/jpeg" }],
      toJSON: () => ({ ...plainPost, media: [{ url: "bucket/img.jpg", mimeType: "image/jpeg" }] }),
    };
    Post.findByPk.mockResolvedValue(postWithMedia);
    getSignedUrl.mockResolvedValue("https://signed.url/img.jpg");

    const result = await getPostById(POST_ID);

    expect(getSignedUrl).toHaveBeenCalled();
    expect(result.media[0].url).toBe("https://signed.url/img.jpg");
  });

  it("should not sign media URL when URL is an unsupported HTTP path", async () => {
    const postWithUnsupportedUrl = {
      ...plainPost,
      media: [{ url: "https://cdn.example.com/file.jpg", mimeType: "image/jpeg" }],
      toJSON: () => ({ ...plainPost, media: [{ url: "https://cdn.example.com/file.jpg" }] }),
    };
    Post.findByPk.mockResolvedValue(postWithUnsupportedUrl);

    const result = await getPostById(POST_ID);

    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(result.media[0].url).toBe("https://cdn.example.com/file.jpg");
  });

  it("should sign media URL for known public bucket URL format", async () => {
    const postWithSupabaseUrl = {
      ...plainPost,
      media: [
        {
          url: "https://example.com/storage/v1/object/public/posts/folder/image.jpg",
          mimeType: "image/jpeg",
        },
      ],
      toJSON: () => ({
        ...plainPost,
        media: [
          {
            url: "https://example.com/storage/v1/object/public/posts/folder/image.jpg",
          },
        ],
      }),
    };
    Post.findByPk.mockResolvedValue(postWithSupabaseUrl);
    getSignedUrl.mockResolvedValue("https://signed.url/from-public");

    const result = await getPostById(POST_ID);

    expect(getSignedUrl).toHaveBeenCalled();
    expect(result.media[0].url).toBe("https://signed.url/from-public");
  });

  it("should keep original media item when URL parsing fails", async () => {
    const postWithInvalidUrl = {
      ...plainPost,
      media: [{ url: "http://%", mimeType: "image/jpeg" }],
      toJSON: () => ({ ...plainPost, media: [{ url: "http://%" }] }),
    };
    Post.findByPk.mockResolvedValue(postWithInvalidUrl);

    const result = await getPostById(POST_ID);

    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(result.media[0].url).toBe("http://%");
  });
});

// ─── updatePost ───────────────────────────────────────────────────────────────

describe("updatePost", () => {
  it("should update and return the post when owner calls it", async () => {
    const post = { ...mockPost, update: jest.fn().mockResolvedValue(undefined) };
    Post.findByPk.mockResolvedValue(post);

    const result = await updatePost(POST_ID, { title: "Updated Title" }, USER_ID);

    expect(post.update).toHaveBeenCalledWith({ title: "Updated Title" });
    expect(result).toBe(post);
  });

  it("should throw NotFoundError when post does not exist", async () => {
    Post.findByPk.mockResolvedValue(null);

    await expect(updatePost("missing", {}, USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the post", async () => {
    Post.findByPk.mockResolvedValue({ ...mockPost, createdBy: 99 });

    await expect(updatePost(POST_ID, {}, USER_ID)).rejects.toThrow(ForbiddenError);
    await expect(updatePost(POST_ID, {}, USER_ID)).rejects.toThrow("You are not allowed to update this post");
  });
});

// ─── deletePost ───────────────────────────────────────────────────────────────

describe("deletePost", () => {
  it("should hard-delete the post when softDelete is not 'true'", async () => {
    const post = { ...mockPost, destroy: jest.fn().mockResolvedValue(undefined) };
    Post.findByPk.mockResolvedValue(post);

    const result = await deletePost(POST_ID, "false", USER_ID);

    expect(post.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should soft-delete by setting isActive=false when softDelete is 'true'", async () => {
    const post = { ...mockPost, update: jest.fn().mockResolvedValue(undefined) };
    Post.findByPk.mockResolvedValue(post);

    await deletePost(POST_ID, "true", USER_ID);

    expect(post.update).toHaveBeenCalledWith({ isActive: false });
    expect(post.destroy).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when post does not exist", async () => {
    Post.findByPk.mockResolvedValue(null);

    await expect(deletePost("missing", "false", USER_ID)).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when caller does not own the post", async () => {
    Post.findByPk.mockResolvedValue({ ...mockPost, createdBy: 99 });

    await expect(deletePost(POST_ID, "false", USER_ID)).rejects.toThrow(ForbiddenError);
  });
});
