const { ipKeyGenerator } = require("express-rate-limit");
const { createRateLimiter } = require("./rateLimiter");

const projectLogRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => req.project?._id?.toString() || ipKeyGenerator(req.ip),
  message: "Too many logs from this project. Please slow down."
});

module.exports = projectLogRateLimiter;