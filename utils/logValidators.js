const LOG_LEVELS = new Set(["info", "warn", "error"]);

function validateLogPayload(payload = {}) {
  const errors = [];

  if (typeof payload.message !== "string" || !payload.message.trim()) {
    errors.push({ field: "message", message: "Message is required" });
  } else if (payload.message.length > 10000) {
    errors.push({ field: "message", message: "Message must be 10,000 characters or fewer" });
  }

  if (payload.level !== undefined && !LOG_LEVELS.has(payload.level)) {
    errors.push({ field: "level", message: "Level must be info, warn, or error" });
  }

  if (payload.statusCode !== undefined && (!Number.isInteger(payload.statusCode) || payload.statusCode < 100 || payload.statusCode > 599)) {
    errors.push({ field: "statusCode", message: "Status code must be an integer from 100 to 599" });
  }

  for (const field of ["endpoint", "method", "stack"]) {
    if (payload[field] !== undefined && typeof payload[field] !== "string") {
      errors.push({ field, message: `${field} must be a string` });
    }
  }

  if (payload.metadata !== undefined && (payload.metadata === null || typeof payload.metadata !== "object")) {
    errors.push({ field: "metadata", message: "Metadata must be an object" });
  }

  return errors;
}

module.exports = {
  validateLogPayload
};