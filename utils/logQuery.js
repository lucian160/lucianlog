function normalizeLevel(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function buildLogFilter({ projectId, level, statusCode, search }) {
  const filter = {};

  if (projectId) {
    filter.projectId = projectId;
  }

  const normalizedLevel = normalizeLevel(level);
  if (normalizedLevel && ["info", "warn", "error"].includes(normalizedLevel)) {
    filter.level = normalizedLevel;
  }

  const parsedStatusCode = Number(statusCode);
  if (Number.isInteger(parsedStatusCode) && parsedStatusCode >= 100 && parsedStatusCode <= 599) {
    filter.statusCode = parsedStatusCode;
  }

  const normalizedSearch = typeof search === "string" ? search.trim() : "";
  if (normalizedSearch) {
    const regex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    filter.$or = [
      { message: regex },
      { endpoint: regex },
      { method: regex },
      { stack: regex }
    ];
  }

  return filter;
}

module.exports = {
  buildLogFilter
};
