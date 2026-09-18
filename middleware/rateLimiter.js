const rateLimit = require("express-rate-limit");

const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests", keyGenerator } = {}) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    message: {
      message
    }
  });

module.exports = {
  createRateLimiter
};
