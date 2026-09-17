const express = require("express");
const Notification = require("../models/Notification");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { sendOtpEmail } = require("../services/email");

const router = express.Router();

function serializeNotification(item) {
  return {
    id: item._id,
    title: item.title,
    message: item.message,
    channels: item.channels,
    delivered: item.delivered,
    readAt: item.readAt || null,
    unread: !item.readAt,
    createdAt: item.createdAt
  };
}

router.get("/notifications", authenticateUser, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { userId: req.user.userId },
        { email: (req.user.email || "").toLowerCase() }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.json({
      notifications: notifications.map(serializeNotification)
    });
  } catch (error) {
    console.error("❌ Failed to fetch user notifications:", error.message);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.post("/notifications/:id/read", authenticateUser, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user.userId },
        { email: (req.user.email || "").toLowerCase() }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      message: "Notification marked as read",
      notification: serializeNotification(notification)
    });
  } catch (error) {
    console.error("❌ Failed to mark notification as read:", error.message);
    res.status(500).json({ message: "Failed to update notification" });
  }
});

router.get("/admin/notifications", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(20);

    res.json({
      notifications: notifications.map((item) => ({
        ...serializeNotification(item),
        userId: item.userId,
        email: item.email
      }))
    });
  } catch (error) {
    console.error("❌ Failed to fetch notifications:", error.message);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.post("/admin/notifications/send", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { email, userId, title, message, channels } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const targetChannels = Array.isArray(channels) && channels.length
      ? channels.filter((channel) => ["email", "in_app"].includes(channel))
      : ["in_app"];

    let targetUser = null;

    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    }

    if (!targetUser && !email && !userId) {
      return res.status(400).json({ message: "A user or email address is required" });
    }

    const notification = await Notification.create({
      userId: targetUser ? targetUser._id : null,
      email: targetUser ? targetUser.email : String(email || "").trim().toLowerCase() || null,
      title,
      message,
      channels: targetChannels,
      sentBy: req.user.userId,
      delivered: false
    });

    if (targetChannels.includes("email")) {
      const recipientEmail = targetUser ? targetUser.email : String(email || "").trim();
      if (recipientEmail) {
        await sendOtpEmail({
          to: recipientEmail,
          otp: "NOTICE",
          purpose: "notification"
        });
      }
    }

    if (targetChannels.includes("in_app")) {
      notification.delivered = true;
      await notification.save();
    }

    res.status(201).json({
      message: "Notification sent successfully",
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        channels: notification.channels,
        delivered: notification.delivered
      }
    });
  } catch (error) {
    console.error("❌ Failed to send notification:", error.message);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

module.exports = router;
module.exports.serializeNotification = serializeNotification;
