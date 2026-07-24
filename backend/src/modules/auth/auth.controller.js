const asyncHandler = require("../../shared/utils/asyncHandler");

const { signupSchema, loginSchema } = require("./auth.validation");

const authService = require("./auth.service");

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

const getRefreshCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

const getRefreshCookieOptions = () => ({
  ...getRefreshCookieBaseOptions(),
  maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE_DAYS || 7) * 24 * 60 * 60 * 1000,
});

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieBaseOptions());
  res.clearCookie("token");
};

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

  setRefreshTokenCookie(res, result.refreshToken);

  res.json({
    success: true,
    message: "Login successful",
    accessToken: result.accessToken,
    user: result.user,
  });
});

const refresh = asyncHandler(async (req, res) => {
  let result;

  try {
    result = await authService.refreshSession(req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]);
  } catch (error) {
    clearRefreshTokenCookie(res);

    return res.status(401).json({
      success: false,
      message: error.message || "Invalid refresh token",
    });
  }

  setRefreshTokenCookie(res, result.refreshToken);

  res.json({
    success: true,
    message: "Session refreshed",
    accessToken: result.accessToken,
    user: result.user,
  });
});

const logout = asyncHandler(async (req, res) => {
  clearRefreshTokenCookie(res);

  res.json({
    success: true,
    message: "Logout successful",
  });
});

module.exports = {
  signup,
  login,
  refresh,
  logout,
};
