const Project = require("../models/Project");

const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        message: "API key is required"
      });
    }

    const project = await Project.findOne({
      apiKey,
      active: true
    });

    if (!project) {
      return res.status(401).json({
        message: "Invalid or inactive API key"
      });
    }

    req.project = project;

    next();
  } catch (error) {
    console.error("❌ API key authentication failed:", error.message);

    res.status(500).json({
      message: "Authentication failed"
    });
  }
};

module.exports = authenticateApiKey;