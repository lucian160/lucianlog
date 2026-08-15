const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },

    project: {
      type: String,
      required: true,
      trim: true
    },

    level: {
      type: String,
      enum: ["info", "warn", "error"],
      default: "info"
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    endpoint: {
      type: String,
      trim: true
    },

    method: {
      type: String,
      trim: true
    },

    statusCode: {
      type: Number
    },

    stack: {
      type: String
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Log", logSchema);