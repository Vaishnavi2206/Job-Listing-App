const APPLICATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  INTERVIEW: "interview",
  REJECTED: "rejected",
  HIRED: "hired",
};

const VALID_STATUS_TRANSITIONS = {
  pending: ["accepted", "rejected"],
  accepted: ["interview", "rejected"],
  interview: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

module.exports = {
  APPLICATION_STATUS,
  VALID_STATUS_TRANSITIONS,
};
