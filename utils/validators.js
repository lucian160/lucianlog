function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidIp(ip) {
  if (typeof ip !== "string") return false;

  const trimmed = ip.trim();
  if (!trimmed) return false;

  const parts = trimmed.split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}

module.exports = {
  isValidEmail,
  isValidIp
};
