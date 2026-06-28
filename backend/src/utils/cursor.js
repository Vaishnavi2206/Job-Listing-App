const encodeCursor = ({ createdAt, id }) => {
  return Buffer.from(
    JSON.stringify({
      createdAt,
      id,
    })
  ).toString("base64");
};

 
const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    return JSON.parse(
      Buffer.from(cursor, "base64").toString()
    );
  } catch {
    return null;
  }
};

module.exports = {
  encodeCursor,
  decodeCursor,
};