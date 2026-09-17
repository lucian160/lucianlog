const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const logRoutes = require("./routes/logs");
const adminRoutes = require("./routes/admin");
const healthRoutes = require("./routes/health");
const notificationRoutes = require("./routes/notifications");
const { createFirewallMiddleware } = require("./middleware/firewall");
const { createRateLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 5000;

const firewallMiddleware = createFirewallMiddleware({
  enabled: process.env.LUCIAN_FIREWALL_ENABLED === "true",
  allowedIps: (process.env.LUCIAN_ALLOWED_IPS || "").split(",").map((ip) => ip.trim()).filter(Boolean),
  approvalToken: process.env.LUCIAN_FIREWALL_APPROVAL_TOKEN || "",
  requiredApprovalHeader: process.env.LUCIAN_FIREWALL_HEADER || "x-lucian-approval"
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts. Please wait a while and try again."
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many requests from this client."
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(firewallMiddleware);
app.use(apiLimiter);
app.use(express.static("public"));

// Routes
app.use("/health", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/projects", authLimiter, projectRoutes);
app.use("/api/logs", apiLimiter, logRoutes);
app.use("/api/admin", authLimiter, adminRoutes);
app.use("/api", notificationRoutes);

// Landing page
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    try {
      const indexes = await mongoose.connection
        .collection("projects")
        .indexes();

      console.log("📋 Project indexes:", indexes);
    } catch (error) {
      console.warn("⚠️ Could not inspect indexes:", error.message);
    }
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
  });

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});