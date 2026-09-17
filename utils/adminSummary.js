function buildAdminSummary({ pendingRequests = [], recentErrors = [] }) {
  const pendingCount = Array.isArray(pendingRequests) ? pendingRequests.length : 0;
  const errorCount = Array.isArray(recentErrors) ? recentErrors.length : 0;

  return {
    pendingCount,
    errorCount,
    hasAction: pendingCount > 0 || errorCount > 0
  };
}

module.exports = {
  buildAdminSummary
};
