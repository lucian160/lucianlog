function buildFirewallDecision({
  enabled = false,
  allowedIps = [],
  reqIp = "",
  approvalToken = "",
  requiredApprovalHeader = "x-lucian-approval",
  approvalHeader = ""
}) {
  if (!enabled) {
    return { allowed: true, reason: null };
  }

  const normalizedReqIp = String(reqIp || "").trim();
  const normalizedAllowedIps = Array.isArray(allowedIps)
    ? allowedIps.map((ip) => String(ip).trim()).filter(Boolean)
    : [];

  const headerName = String(requiredApprovalHeader || "x-lucian-approval").trim();
  const approvalHeaderValue = String(approvalHeader || "").trim();
  const approvalTokenValue = String(approvalToken || "").trim();
  const validApproval = Boolean(
    approvalHeaderValue && approvalTokenValue && approvalHeaderValue === approvalTokenValue
  );

  if (normalizedAllowedIps.length === 0) {
    return validApproval
      ? { allowed: true, reason: null }
      : {
          allowed: false,
          reason: "approval_required",
          header: headerName
        };
  }

  if (!normalizedReqIp) {
    return {
      allowed: false,
      reason: "missing_ip"
    };
  }

  if (!normalizedAllowedIps.includes(normalizedReqIp)) {
    return {
      allowed: false,
      reason: "ip_not_allowed"
    };
  }

  if (!validApproval) {
    return {
      allowed: false,
      reason: "approval_required",
      header: headerName
    };
  }

  return { allowed: true, reason: null };
}

function createFirewallMiddleware(options = {}) {
  const config = {
    enabled: Boolean(options.enabled),
    allowedIps: options.allowedIps || [],
    requiredApprovalHeader: options.requiredApprovalHeader || "x-lucian-approval",
    approvalToken: options.approvalToken || "",
    ...options
  };

  return function firewallMiddleware(req, res, next) {
    const forwarded = req.headers["x-forwarded-for"];
    const clientIp = Array.isArray(forwarded)
      ? forwarded[0]
      : String(forwarded || "").split(",")[0].trim();

    const decision = buildFirewallDecision({
      enabled: config.enabled,
      allowedIps: config.allowedIps,
      reqIp: clientIp || req.ip || req.socket?.remoteAddress || "",
      approvalToken: config.approvalToken,
      requiredApprovalHeader: config.requiredApprovalHeader,
      approvalHeader:
        req.headers[config.requiredApprovalHeader] ||
        req.headers[config.requiredApprovalHeader.toLowerCase()] ||
        ""
    });

    if (!decision.allowed) {
      if (decision.reason === "approval_required") {
        return res.status(403).json({
          message: "Firewall approval required",
          requiredHeader: decision.header
        });
      }

      return res.status(403).json({
        message: "Access denied by firewall",
        reason: decision.reason
      });
    }

    return next();
  };
}

module.exports = {
  buildFirewallDecision,
  createFirewallMiddleware
};
