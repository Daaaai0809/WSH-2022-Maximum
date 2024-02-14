/**
 * @param {string} dateLeft
 * @param {string} dateRight
 * @returns {boolean}
 */
export const isSameDay = (dateLeft, dateRight) => {
  const left = new Date(dateLeft);
  const right = new Date(dateRight);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

/**
 *
 * @param {string} ts
 * @returns {string}
 */
export const formatTime = (ts) => {
  const date = new Date(ts);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
};

/**
 * @param {string} closeAt
 * @param {number | Date} now
 * @returns {string}
 */
export const formatCloseAt = (closeAt, now = new Date()) => {
  const closeDate = new Date(closeAt);
  if (closeDate < now) {
    return "投票締切";
  }

  const diffInMinutes = Math.floor((closeDate - now) / 60000);
  if (diffInMinutes > 120) {
    return "投票受付中";
  }

  return `締切${diffInMinutes}分前`;
};
