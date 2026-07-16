export const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

const LAST_ACTIVITY_KEY = "lastActivityAt";

export const markSessionActivity = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

export const clearSessionActivity = () => {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};

export const getLastActivityAt = () => {
  const lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY));

  return Number.isFinite(lastActivityAt) ? lastActivityAt : null;
};

export const isSessionIdleExpired = () => {
  const lastActivityAt = getLastActivityAt();

  return !!lastActivityAt && Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS;
};

export const getRemainingIdleTime = () => {
  const lastActivityAt = getLastActivityAt();

  if (!lastActivityAt) {
    return IDLE_TIMEOUT_MS;
  }

  return Math.max(IDLE_TIMEOUT_MS - (Date.now() - lastActivityAt), 0);
};
