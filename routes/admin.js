const express = require("express");
const { buildAdminSummary } = require("../utils/adminSummary");
const Log = require("../models/Log");
const FirewallRequest = require("../models/FirewallRequest");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

function serializeUserSummary(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt
  };
}

router.get("/users", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(50).select("-password");

    res.json({
      users: users.map(serializeUserSummary)
    });
  } catch (error) {
    console.error("❌ Failed to fetch users:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.post("/users/:id/role", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "A valid role is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    await AuditLog.create({
      action: "user_role_updated",
      actor: req.user.userId,
      details: { userId: user._id, role },
      ipAddress: req.ip
    });

    res.json({
      message: "User role updated",
      user: serializeUserSummary(user)
    });
  } catch (error) {
    console.error("❌ Failed to update user role:", error.message);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

router.post("/firewall/request", authenticateUser, async (req, res) => {
  try {
    const { ip, note } = req.body || {};

    if (!ip) {
      return res.status(400).json({
        message: "IP address is required"
      });
    }

    const request = await FirewallRequest.create({
      ip,
      note: note || "Manual firewall approval requested",
      requestedBy: req.user.userId,
      status: "pending"
    });

    await AuditLog.create({
      action: "firewall_request_created",
      actor: req.user.userId,
      details: { ip, note, requestId: request._id },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: "Firewall approval request submitted",
      request: {
        id: request._id,
        ip: request.ip,
        note: request.note,
        status: request.status,
        requestedAt: request.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Firewall request failed:", error.message);
    res.status(500).json({
      message: "Failed to submit firewall request"
    });
  }
});

router.get("/summary", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const [recentErrors, pendingRequests, firewallHistory] = await Promise.all([
      Log.find({
        level: "error"
      }).sort({ createdAt: -1 }).limit(10),
      FirewallRequest.find({ status: "pending" }).sort({ createdAt: -1 }),
      FirewallRequest.find({ status: { $in: ["approved", "rejected"] } }).sort({ updatedAt: -1 }).limit(10)
    ]);

    const summary = buildAdminSummary({
      pendingRequests,
      recentErrors
    });

    res.json({
      pendingCount: summary.pendingCount,
      errorCount: summary.errorCount,
      hasAction: summary.hasAction,
      pendingRequests: pendingRequests.map((request) => ({
        id: request._id,
        ip: request.ip,
        note: request.note,
        status: request.status,
        requestedAt: request.createdAt
      })),
      firewallHistory: firewallHistory.map((request) => ({
        id: request._id,
        ip: request.ip,
        status: request.status,
        note: request.note,
        approvedAt: request.approvedAt || request.updatedAt,
        updatedAt: request.updatedAt
      })),
      recentErrors
    });
  } catch (error) {
    console.error("❌ Failed to fetch admin summary:", error.message);
    res.status(500).json({
      message: "Failed to fetch admin summary"
    });
  }
});

router.get("/firewall/history", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const history = await FirewallRequest.find({
      status: { $in: ["approved", "rejected"] }
    }).sort({ updatedAt: -1 }).limit(20);

    res.json({
      history: history.map((request) => ({
        id: request._id,
        ip: request.ip,
        status: request.status,
        note: request.note,
        approvedAt: request.approvedAt || request.updatedAt,
        updatedAt: request.updatedAt
      }))
    });
  } catch (error) {
    console.error("❌ Failed to fetch firewall history:", error.message);
    res.status(500).json({
      message: "Failed to fetch firewall history"
    });
  }
});

router.post("/firewall/approve/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const request = await FirewallRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Firewall request not found"
      });
    }

    request.status = "approved";
    request.approvedBy = req.user.userId;
    request.approvedAt = new Date();
    await request.save();

    await AuditLog.create({
      action: "firewall_request_approved",
      actor: req.user.userId,
      details: { requestId: request._id, ip: request.ip },
      ipAddress: req.ip
    });

    res.json({
      message: "Firewall request approved",
      request: {
        id: request._id,
        ip: request.ip,
        status: request.status,
        approvedAt: request.approvedAt
      }
    });
  } catch (error) {
    console.error("❌ Firewall approval failed:", error.message);
    res.status(500).json({
      message: "Failed to approve firewall request"
    });
  }
});

router.post("/firewall/reject/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body || {};
    const request = await FirewallRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Firewall request not found"
      });
    }

    request.status = "rejected";
    request.approvedBy = req.user.userId;
    request.approvedAt = new Date();
    request.note = reason || request.note || "Rejected by administrator";
    await request.save();

    await AuditLog.create({
      action: "firewall_request_rejected",
      actor: req.user.userId,
      details: {
        requestId: request._id,
        ip: request.ip,
        reason: reason || "No reason provided"
      },
      ipAddress: req.ip
    });

    res.json({
      message: "Firewall request rejected",
      request: {
        id: request._id,
        ip: request.ip,
        status: request.status,
        approvedAt: request.approvedAt,
        reason: reason || request.note
      }
    });
  } catch (error) {
    console.error("❌ Firewall rejection failed:", error.message);
    res.status(500).json({
      message: "Failed to reject firewall request"
    });
  }
});

module.exports = router;
module.exports.serializeUserSummary = serializeUserSummary;
