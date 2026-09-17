const test = require("node:test");
const assert = require("node:assert/strict");

const { serializeNotification } = require("../routes/notifications");
const { serializeUserSummary } = require("../routes/admin");

test("serializeNotification exposes the user-facing notification payload", () => {
  const serialized = serializeNotification({
    _id: "507f1f77bcf86cd799439011",
    title: "Security update",
    message: "Your firewall request was approved.",
    channels: ["email", "in_app"],
    delivered: true,
    readAt: null,
    createdAt: "2026-09-17T12:00:00.000Z"
  });

  assert.deepEqual(serialized, {
    id: "507f1f77bcf86cd799439011",
    title: "Security update",
    message: "Your firewall request was approved.",
    channels: ["email", "in_app"],
    delivered: true,
    readAt: null,
    unread: true,
    createdAt: "2026-09-17T12:00:00.000Z"
  });
});

test("serializeUserSummary gives admin a compact user access row", () => {
  const serialized = serializeUserSummary({
    _id: "507f1f77bcf86cd799439022",
    name: "Ava",
    email: "ava@example.com",
    role: "admin",
    emailVerified: true,
    lastLoginAt: "2026-09-17T12:00:00.000Z"
  });

  assert.deepEqual(serialized, {
    id: "507f1f77bcf86cd799439022",
    name: "Ava",
    email: "ava@example.com",
    role: "admin",
    emailVerified: true,
    lastLoginAt: "2026-09-17T12:00:00.000Z"
  });
});
