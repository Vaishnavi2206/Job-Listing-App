const asyncHandler = require("../../shared/utils/asyncHandler");

const {
  signupSchema,
  loginSchema,
} = require("./auth.validation");

const authService = require("./auth.service");

const signup = asyncHandler(async (req, res) => {
  const validatedData = signupSchema.parse(req.body);

  const user = await authService.signup(validatedData);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);

  const result = await authService.login(validatedData);

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.json({
    success: true,
    message: "Login successful",
    token: result.token,
    user: result.user,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");

  res.json({
    success: true,
    message: "Logout successful",
  });
});

module.exports = {
  signup,
  login,
  logout,
};
