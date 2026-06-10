const ROLES = require("../shared/constants/roles");

const employerOnly = (req, res, next) => {
  if (req.user?.roleName !== ROLES.EMPLOYER) {
    return res.status(403).json({
      success: false,
      message: "Only employers can perform this action",
    });
  }

  next();
};

module.exports = employerOnly;
