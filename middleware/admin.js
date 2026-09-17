function requireAdmin(req, res, next) {
  const role = req.user?.role || "user";

  if (role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  return next();
}

module.exports = {
  requireAdmin
};
