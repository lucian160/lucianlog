const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Project = require("./models/Project");
const Log = require("./models/Log");
const authenticateApiKey = require("./middleware/apiKey");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
  });

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Lucian Logs API is running 🚀"
  });
});

app.post("/api/logs", authenticateApiKey, async (req, res) => {
  try {
    const log = await Log.create({...req.body,
      projectId: req.project._id,
      project: req.project.name
  });

    res.status(201).json({
      message: "Log saved successfully",
      log
    });
  } catch (error) {
    console.error("❌ Failed to save log:", error.message);

    res.status(500).json({
      message: "Failed to save log",
      error: error.message
    });
  }
}); 

app.get("/api/logs", authenticateApiKey, async (req, res) => {
  try {
    const logs = await Log.find({
      projectId: req.project._id
    }).sort({ createdAt: -1 });

    res.json({
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error("❌ Failed to fetch logs:", error.message);

    res.status(500).json({
      message: "Failed to fetch logs",
      error: error.message
    });
  }
});


app.post("/api/projects", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required"
      });
    }

    const apiKey = `lgs_${crypto.randomBytes(32).toString("hex")}`;

    const project = await Project.create({
      name,
      apiKey
    });

    res.status(201).json({
      message: "Project created successfully",
      project: {
        id: project._id,
        name: project.name,
        apiKey: project.apiKey,
        active: project.active,
        createdAt: project.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Failed to create project:", error.message);

    res.status(500).json({
      message: "Failed to create project",
      error: error.message
    });
  }
});

app.patch("/api/projects/:id/deactivate", authenticateApiKey, async (req, res) => {
  try {
    if (req.project._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: "You can only manage your own project"
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

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

app.patch("/api/projects/:id/activate", authenticateApiKey, async (req, res) => {
  try {
    if (req.project._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: "You can only manage your own project"
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { active: true },
      { new: true }
    );

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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});