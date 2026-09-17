const mongoose = require("mongoose");

const firewallRequestSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      trim: true
    },

    note: {
      type: String,
      default: "Manual firewall approval requested",
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("FirewallRequest", firewallRequestSchema);
