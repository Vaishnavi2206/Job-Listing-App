const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../users/user.model");
const Role = require("../roles/role.model");

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

  console.log("role", role)

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

  return user;
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

  const token = jwt.sign(
    {
      userId: user.id,
      roleId: user.roleId,
      roleName: user.Role.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      roleName: user.Role.name,
    },
  };
};

module.exports = {
  signup,
  login,
};
