const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../shared/utils/errors");

const authMiddleware = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new UnauthorizedError("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    // JsonWebTokenError / TokenExpiredError will be handled by errorMiddleware
    next(error);
  }
};

module.exports = authMiddleware;
