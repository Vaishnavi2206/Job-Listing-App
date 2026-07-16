const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../users/user.model");
const Role = require("../roles/role.model");

const getAccessTokenSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return process.env.JWT_SECRET;
};

const getRefreshTokenSecret = () =>
  process.env.JWT_REFRESH_SECRET || getAccessTokenSecret();

const buildTokenPayload = (user) => ({
  userId: user.id,
  roleId: user.roleId,
  roleName: user.Role.name,
});

const buildUserResponse = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  roleName: user.Role.name,
});

const createAccessToken = (user) =>
  jwt.sign(buildTokenPayload(user), getAccessTokenSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

const createRefreshToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
    },
    getRefreshTokenSecret(),
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
  );

const createTokenPair = (user) => ({
  accessToken: createAccessToken(user),
  refreshToken: createRefreshToken(user),
});

const signup = async (payload) => {
  const existingUser = await User.findOne({
    where: {
      username: payload.username,
    },
  });

  if (existingUser) {
    throw new Error("Username already exists");
  }

  const role = await Role.findOne({
    where: {
      name: payload.roleName,
    },
  });

  if (!role) {
    throw new Error("Invalid role");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    username: payload.username,
    password: hashedPassword,
    roleId: role.id,
  });

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    roleName: role.name,
  };
};

const login = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
    include: [
      {
        model: Role,
      },
    ],
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const tokens = createTokenPair(user);

  return {
    ...tokens,
    user: buildUserResponse(user),
  };
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, getRefreshTokenSecret());
  } catch (error) {
    throw new Error("Invalid refresh token");
  }

  const user = await User.findByPk(decoded.userId, {
    include: [
      {
        model: Role,
      },
    ],
  });

  if (!user) {
    throw new Error("User not found");
  }

  const tokens = createTokenPair(user);

  return {
    ...tokens,
    user: buildUserResponse(user),
  };
};

module.exports = {
  signup,
  login,
  refreshSession,
};
