const APPLICATION_STATUS = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  INTERVIEW: "interview",
  REJECTED: "rejected",
  HIRED: "hired",
};

const VALID_STATUS_TRANSITIONS = {
  pending: ["reviewed", "rejected"],
  reviewed: ["interview", "rejected"],
  interview: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

module.exports = {
  APPLICATION_STATUS,
  VALID_STATUS_TRANSITIONS,
};
