const Post = require("../posts/posts.model");
const PostMedia = require("../posts/postMedia.model");
const User = require("../users/user.model");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { Op } = require("sequelize");
const sequelize = require("../../config/db");
const { decodeCursor, encodeCursor } = require("../../utils/cursor");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "posts";
const READ_URL_EXPIRES_IN_SECONDS = 900;

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

// Re-usable include for fetching media ordered by displayOrder
const mediaInclude = {
  model: PostMedia,
  as: "media",
  attributes: ["id", "url", "mimeType", "mediaType", "filename", "size", "width", "height", "duration", "displayOrder"],
  order: [["displayOrder", "ASC"]],
};

const authorInclude = {
  model: User,
  attributes: ["id", "firstName", "lastName", "username"],
};

const extractStorageKey = (storedValue) => {
  if (!storedValue) return null;

  if (!/^https?:\/\//i.test(storedValue)) {
    return storedValue.replace(/^\/+/, "");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(storedValue);
  } catch {
    return null;
  }

  const path = decodeURIComponent(parsedUrl.pathname);
  const knownPrefixes = [
    `/storage/v1/object/public/${BUCKET}/`,
    `/storage/v1/object/sign/${BUCKET}/`,
    `/storage/v1/object/authenticated/${BUCKET}/`,
    `/storage/v1/s3/${BUCKET}/`,
  ];

  for (const prefix of knownPrefixes) {
    if (path.startsWith(prefix)) {
      return path.slice(prefix.length);
    }
  }

  return null;
};

const signMediaItemUrl = async (mediaItem) => {
  const key = extractStorageKey(mediaItem.url);

  if (!key) {
    return mediaItem;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const signedReadUrl = await getSignedUrl(s3, command, {
    expiresIn: READ_URL_EXPIRES_IN_SECONDS,
  });

  return {
    ...mediaItem,
    url: signedReadUrl,
  };
};

const toPostResponse = async (post) => {
  const plainPost = post?.toJSON ? post.toJSON() : post;

  if (!plainPost?.media?.length) {
    return plainPost;
  }

  const signedMedia = await Promise.all(plainPost.media.map(signMediaItemUrl));

  return {
    ...plainPost,
    media: signedMedia,
  };
};

const createPost = async (payload) => {
  const { mediaItems, ...postData } = payload;

  const post = await Post.create(postData);

  if (mediaItems && mediaItems.length > 0) {
    const records = mediaItems.map((item, index) => ({
      ...item,
      postId: post.id,
      displayOrder: item.displayOrder ?? index,
    }));
    await PostMedia.bulkCreate(records);
  }

  const createdPost = await Post.findByPk(post.id, { include: [authorInclude, mediaInclude] });

  return toPostResponse(createdPost);
};

const getAllPosts = async (options) => {
  const { limit = 10, cursor } = options;
  const order = [
    ["createdAt", "DESC"],
    ["id", "DESC"],
  ];
  const cursorData = decodeCursor(cursor);

  const where = {
    isActive: true,
  };

  if (cursorData) {
    where[Op.and] = [
      sequelize.literal(`
          ("Post"."createdAt", "Post"."id")
          <
          (
            ${sequelize.escape(cursorData.createdAt)},
            ${sequelize.escape(cursorData.id)}
          )
        `),
    ];
  }

  const query = {
    where,
    order,
    limit: Number(limit) + 1,
    include: [authorInclude, mediaInclude],
  };
  const posts = await Post.findAll(query);
  const hasMore = posts.length > Number(limit);

  if (hasMore) {
    posts.pop();
  }

  let nextCursor = null;

  if (hasMore && posts.length) {
    const lastPost = posts[posts.length - 1];

    nextCursor = encodeCursor({
      createdAt: lastPost.createdAt,
      id: lastPost.id,
    });
  }

  const responsePosts = await Promise.all(posts.map(toPostResponse));

  return {
    posts: responsePosts,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};

const getPostById = async (id) => {
  const post = await Post.findByPk(id, {
    include: [
      { model: User },
      mediaInclude,
    ],
  });

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  return toPostResponse(post);
};

const updatePost = async (postId, payload, userId) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (post.createdBy !== userId) {
    throw new ForbiddenError("You are not allowed to update this post");
  }

  await post.update(payload);

  return post;
};

const deletePost = async (postId, softDelete, userId) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (post.createdBy !== userId) {
    throw new ForbiddenError("You are not allowed to delete this post");
  }

  if (softDelete === "true") {
    await post.update({ isActive: false });
  } else {
    await post.destroy();
  }

  return true;
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
