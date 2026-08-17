const express = require("express");

const Log = require("../models/Log");
const authenticateApiKey = require("../middleware/apiKey");

const router = express.Router();

// SAVE LOG
router.post("/", authenticateApiKey, async (req, res) => {
  try {
    const log = await Log.create({
      ...req.body,
      projectId: req.project._id,
      project: req.project.name
    });

    res.status(201).json({
      message: "Log saved successfully",
      log
    });

  } catch (error) {
  console.error("❌ Failed to save log:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid log data",
        errors: Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      message: "Failed to save log"
    });
  }
});

// GET DASHBOARD SUMMARY
router.get("/summary", authenticateApiKey, async (req, res) => {
  try {
    const projectId = req.project._id;

    const totalLogs = await Log.countDocuments({
      projectId
    });

    const errorCount = await Log.countDocuments({
      projectId,
      level: "error"
    });

    const warningCount = await Log.countDocuments({
      projectId,
      level: "warn"
    });

    const infoCount = await Log.countDocuments({
      projectId,
      level: "info"
    });

    const latestLog = await Log.findOne({
      projectId
    }).sort({
      createdAt: -1
    });

    const errorRate = totalLogs === 0
      ? 0
      : Number(((errorCount / totalLogs) * 100).toFixed(2));

    res.json({
      totalLogs,
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
      errorRate,
      latestLog
    });

  } catch (error) {
    console.error(
      "❌ Failed to fetch dashboard summary:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch dashboard summary"
    });
  }
});

// GET PROJECT LOG STATISTICS
router.get("/stats", authenticateApiKey, async (req, res) => {
  try {
    const period = req.query.period || "24h";

    const periodMap = {
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30
    };

    if (!periodMap[period]) {
      return res.status(400).json({
        message: "Invalid period. Use 24h, 7d or 30d"
      });
    }

    const hours = periodMap[period];

    const startDate = new Date(
      Date.now() - hours * 60 * 60 * 1000
    );

    const projectId = req.project._id;

    const match = {
      projectId,
      createdAt: {
        $gte: startDate
      }
    };

    const total = await Log.countDocuments(match);

    const levelStats = await Log.aggregate([
      {
        $match: match
      },
      {
        $group: {
          _id: "$level",
          count: {
            $sum: 1
          }
        }
      }
    ]);

    const statusStats = await Log.aggregate([
      {
        $match: match
      },
      {
        $group: {
          _id: "$statusCode",
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);

    const timeline = await Log.aggregate([
      {
        $match: match
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$createdAt",
              unit: "hour"
            }
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id": 1
        }
      }
    ]);

    const levels = {};

    levelStats.forEach((item) => {
      levels[item._id] = item.count;
    });

    const statusCodes = {};

    statusStats.forEach((item) => {
      statusCodes[item._id] = item.count;
    });

    res.json({
      period,
      startDate,
      total,
      levels,
      statusCodes,
      timeline: timeline.map((item) => ({
        time: item._id,
        count: item.count
      }))
    });

  } catch (error) {
    console.error(
      "❌ Failed to fetch log statistics:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch log statistics"
    });
  }
});

// GET PROJECT LOGS
router.get("/", authenticateApiKey, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const filter = {
      projectId: req.project._id
    };

    // Filter by level
    if (req.query.level) {
      filter.level = req.query.level;
    }

    // Filter by status code
    if (req.query.statusCode) {
      filter.statusCode = Number(req.query.statusCode);
    }

    const total = await Log.countDocuments(filter);

    const logs = await Log.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      count: logs.length,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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

module.exports = router;