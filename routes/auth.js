const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateUser = require("../middleware/auth");
const { generateOtp, sendOtpEmail } = require("../services/email");
const { isValidEmail } = require("../utils/validators");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationOtp = generateOtp(6);
    const verificationOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: false,
      verificationOtp,
      verificationOtpExpiresAt
    });

    await sendOtpEmail({
      to: user.email,
      otp: verificationOtp,
      purpose: "email-verification"
    });

    await AuditLog.create({
      action: "user_registered",
      actor: user._id,
      details: { email: user.email },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: "Account created successfully. Please verify your email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Registration failed:", error.message);

    if (error.message === "API key is invalid") {
      return res.status(503).json({
        message: "Account created, but the verification email could not be sent. Please contact support."
      });
    }

    res.status(500).json({
      message: "Registration failed"
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      return res.status(423).json({
        message: "Account temporarily locked. Please try again later."
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email is not verified yet. Please verify your account before logging in."
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      user.failedLoginAttempts = attempts;
      if (attempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role || "user"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    await AuditLog.create({
      action: "user_login",
      actor: user._id,
      details: { email: user.email },
      ipAddress: req.ip
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user"
      }
    });

  } catch (error) {
    console.error("❌ Login failed:", error.message);

    res.status(500).json({
      message: "Login failed"
    });
  }
});

// GET CURRENT USER
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      user
    });
  } catch (error) {
    console.error("❌ Failed to fetch user:", error.message);

    res.status(500).json({
      message: "Failed to fetch user"
    });
  }
});

// GET FIREWALL STATUS
router.get("/firewall-status", authenticateUser, async (req, res) => {
  try {
    const enabled = process.env.LUCIAN_FIREWALL_ENABLED === "true";

    res.json({
      firewall: {
        enabled,
        header: process.env.LUCIAN_FIREWALL_HEADER || "x-lucian-approval",
        allowedIps: (process.env.LUCIAN_ALLOWED_IPS || "")
          .split(",")
          .map((ip) => ip.trim())
          .filter(Boolean),
        requiresApproval: enabled
      }
    });
  } catch (error) {
    console.error("❌ Failed to fetch firewall status:", error.message);

    res.status(500).json({
      message: "Failed to fetch firewall status"
    });
  }
});

// REQUEST EMAIL VERIFICATION OTP
router.post("/request-email-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        message: "No account found with that email"
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: "This email is already verified"
      });
    }

    const verificationOtp = generateOtp(6);
    const verificationOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationOtp = verificationOtp;
    user.verificationOtpExpiresAt = verificationOtpExpiresAt;
    await user.save();

    await sendOtpEmail({
      to: user.email,
      otp: verificationOtp,
      purpose: "email-verification"
    });

    res.json({
      message: "Verification code sent to your email",
      email: user.email
    });
  } catch (error) {
    console.error("❌ Email verification request failed:", error.message);

    res.status(500).json({
      message: "Failed to send verification code"
    });
  }
});

// VERIFY EMAIL
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.verificationOtp || !user.verificationOtpExpiresAt) {
      return res.status(400).json({
        message: "No verification code found. Please request a new one."
      });
    }

    if (new Date(user.verificationOtpExpiresAt).getTime() < Date.now()) {
      user.verificationOtp = null;
      user.verificationOtpExpiresAt = null;
      await user.save();

      return res.status(400).json({
        message: "Verification code has expired"
      });
    }

    if (user.verificationOtp !== String(otp).trim()) {
      return res.status(400).json({
        message: "Invalid verification code"
      });
    }

    user.emailVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpiresAt = null;
    await user.save();

    res.json({
      message: "Email verified successfully",
      verified: true
    });
  } catch (error) {
    console.error("❌ Email verification failed:", error.message);

    res.status(500).json({
      message: "Failed to verify email"
    });
  }
});

// REQUEST PASSWORD RESET OTP
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        message: "No account found with that email"
      });
    }

    const otp = generateOtp(6);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOtpEmail({
      to: user.email,
      otp,
      purpose: "password-reset"
    });

    res.json({
      message: "Password reset code sent to your email",
      email: user.email
    });
  } catch (error) {
    console.error("❌ Password reset OTP request failed:", error.message);

    res.status(500).json({
      message: "Failed to send password reset code"
    });
  }
});

// VERIFY PASSWORD RESET OTP
router.post("/verify-password-reset", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        message: "Invalid or expired reset code"
      });
    }

    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();

      return res.status(400).json({
        message: "Reset code has expired"
      });
    }

    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({
        message: "Invalid reset code"
      });
    }

    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({
      message: "OTP verified successfully",
      verified: true
    });
  } catch (error) {
    console.error("❌ OTP verification failed:", error.message);

    res.status(500).json({
      message: "Failed to verify reset code"
    });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        message: "Email, OTP and new password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        message: "Please request a new reset code"
      });
    }

    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();

      return res.status(400).json({
        message: "Reset code has expired"
      });
    }

    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({
        message: "Invalid reset code"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("❌ Password reset failed:", error.message);

    res.status(500).json({
      message: "Failed to reset password"
    });
  }
});

module.exports = router;