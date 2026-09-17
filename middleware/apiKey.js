const crypto = require("crypto");
const Project = require("../models/Project");

module.exports = async (req, res, next) => {
  const incomingKey =
    req.headers["x-api-key"] ||
    req.headers["X-API-Key"] ||
    req.query.apiKey ||
    "";

  if (!incomingKey) {
    return res.status(401).json({
      message: "API key required"
    });
  }

  try {
    const apiKeyHash = crypto
      .createHash("sha256")
      .update(String(incomingKey))
      .digest("hex");

    const project = await Project.findOne({
      apiKeyHash,
      active: true
    });

    if (!project) {
      return res.status(401).json({
        message: "Invalid API key"
      });
    }

    req.project = project;
    return next();
  } catch (error) {
    console.error("❌ API key validation failed:", error.message);

    return res.status(500).json({
      message: "Failed to validate API key"
    });
  }
};
