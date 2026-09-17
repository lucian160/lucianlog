const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    verificationOtp: {
      type: String,
      default: null,
      trim: true
    },

    verificationOtpExpiresAt: {
      type: Date,
      default: null
    },

    otp: {
      type: String,
      default: null,
      trim: true
    },

    otpExpiresAt: {
      type: Date,
      default: null
    },

    lastLoginAt: {
      type: Date,
      default: null
    },

    failedLoginAttempts: {
      type: Number,
      default: 0
    },

    lockedUntil: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);