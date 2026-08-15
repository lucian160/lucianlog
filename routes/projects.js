const express = require("express");
const crypto = require("crypto");

const Project = require("../models/Project");
const Log = require("../models/Log");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

// CREATE PROJECT
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required"
      });
    }

    const apiKey = `lgs_${crypto.randomBytes(32).toString("hex")}`;

    const apiKeyHash = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");

    const project = await Project.create({
      name,
      apiKeyHash,
      owner: req.user.userId
    });

    res.status(201).json({
      message: "Project created successfully",
      project: {
        id: project._id,
        name: project.name,
        apiKey,
        active: project.active,
        createdAt: project.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Failed to create project:", error.message);

    res.status(500).json({
      message: "Failed to create project"
    });
  }
});

// REGENERATE API KEY
router.post("/:id/regenerate-key", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const newApiKey = `lgs_${crypto.randomBytes(32).toString("hex")}`;

    const newApiKeyHash = crypto
      .createHash("sha256")
      .update(newApiKey)
      .digest("hex");

    project.apiKeyHash = newApiKeyHash;
    await project.save();

    res.json({
      message: "API key regenerated successfully",
      project: {
        id: project._id,
        name: project.name,
        apiKey: newApiKey,
        active: project.active
      }
    });

  } catch (error) {
    console.error("❌ Failed to regenerate API key:", error.message);

    res.status(500).json({
      message: "Failed to regenerate API key"
    });
  }
});

// GET USER'S PROJECTS
router.get("/", authenticateUser, async (req, res) => {
  try {
    const projects = await Project.find({
      owner: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      count: projects.length,
      projects: projects.map((project) => ({
        id: project._id,
        name: project.name,
        active: project.active,
        createdAt: project.createdAt
      }))
    });

  } catch (error) {
    console.error("❌ Failed to fetch projects:", error.message);

    res.status(500).json({
      message: "Failed to fetch projects"
    });
  }
});

// GET SINGLE PROJECT
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    res.json({
      project: {
        id: project._id,
        name: project.name,
        active: project.active,
        createdAt: project.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Failed to fetch project:", error.message);

    res.status(500).json({
      message: "Failed to fetch project"
    });
  }
});

// DELETE PROJECT
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    // Delete logs belonging to this project
    await Log.deleteMany({
      projectId: project._id
    });

    res.json({
      message: "Project deleted successfully",
      project: {
        id: project._id,
        name: project.name
      }
    });

  } catch (error) {
    console.error("❌ Failed to delete project:", error.message);

    res.status(500).json({
      message: "Failed to delete project"
    });
  }
});

// DEACTIVATE PROJECT
router.patch("/:id/deactivate", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    project.active = false;
    await project.save();

    res.json({
      message: "Project deactivated successfully",
      project: {
        id: project._id,
        name: project.name,
        active: project.active
      }
    });

  } catch (error) {
    console.error("❌ Failed to deactivate project:", error.message);

    res.status(500).json({
      message: "Failed to deactivate project"
    });
  }
});

// ACTIVATE PROJECT
router.patch("/:id/activate", authenticateUser, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    project.active = true;
    await project.save();

    res.json({
      message: "Project activated successfully",
      project: {
        id: project._id,
        name: project.name,
        active: project.active
      }
    });

  } catch (error) {
    console.error("❌ Failed to activate project:", error.message);

    res.status(500).json({
      message: "Failed to activate project"
    });
  }
});

module.exports = router;