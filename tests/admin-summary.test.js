const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAdminSummary } = require('../utils/adminSummary');

test('buildAdminSummary totals pending firewall requests and recent error logs', () => {
  const summary = buildAdminSummary({
    pendingRequests: [{ id: '1' }, { id: '2' }],
    recentErrors: [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }]
  });

  assert.equal(summary.pendingCount, 2);
  assert.equal(summary.errorCount, 3);
  assert.equal(summary.hasAction, true);
});

test('buildAdminSummary handles empty data', () => {
  const summary = buildAdminSummary({
    pendingRequests: [],
    recentErrors: []
  });

  assert.equal(summary.pendingCount, 0);
  assert.equal(summary.errorCount, 0);
  assert.equal(summary.hasAction, false);
});
