const ROLES = require("../shared/constants/roles");

const candidateOnly = (req, res, next) => {
  if (req.user?.roleName !== ROLES.CANDIDATE) {
    return res.status(403).json({
      success: false,
      message: "Only candidates can perform this action",
    });
  }

  next();
};

module.exports = candidateOnly;
