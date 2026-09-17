const test = require('node:test');
const assert = require('node:assert/strict');

const { buildFirewallDecision, createFirewallMiddleware } = require('../middleware/firewall');

test('buildFirewallDecision blocks unauthorized IPs', () => {
  const decision = buildFirewallDecision({
    enabled: true,
    allowedIps: ['203.0.113.10'],
    reqIp: '198.51.100.22'
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'ip_not_allowed');
});

test('buildFirewallDecision allows approved requests', () => {
  const decision = buildFirewallDecision({
    enabled: true,
    allowedIps: ['203.0.113.10'],
    reqIp: '203.0.113.10',
    approvalToken: 'developer-approved',
    approvalHeader: 'developer-approved'
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, null);
});

test('createFirewallMiddleware denies requests when approval is missing', () => {
  const middleware = createFirewallMiddleware({
    enabled: true,
    allowedIps: ['203.0.113.10'],
    requiredApprovalHeader: 'x-lucian-approval',
    approvalToken: 'developer-approved'
  });

  const req = {
    ip: '203.0.113.10',
    headers: {}
  };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
  let called = false;
  const next = () => { called = true; };

  middleware(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.equal(called, false);
  assert.equal(res.payload.message, 'Firewall approval required');
});
