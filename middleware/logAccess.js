const Project = require("../models/Project");
const authenticateApiKey = require("./apiKey");
const authenticateUser = require("./auth");

module.exports = (req, res, next) => {
  const incomingKey =
    req.headers["x-api-key"] ||
    req.headers["X-API-Key"] ||
    "";

  if (incomingKey) {
    return authenticateApiKey(req, res, next);
  }

  return authenticateUser(req, res, async () => {
    const projectId = req.query.projectId;

    if (!projectId) {
      return res.status(400).json({
        message: "Project ID required"
      });
    }

    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: req.user.userId,
        active: true
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found"
        });
      }

      req.project = project;
      return next();
    } catch (error) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }
  });
};