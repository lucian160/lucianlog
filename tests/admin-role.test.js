const test = require("node:test");
const assert = require("node:assert/strict");

const { requireAdmin } = require("../middleware/admin");

test("requireAdmin rejects non-admin users", () => {
  const req = {
    user: { role: "user" }
  };

  let statusCode = null;
  let payload = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
    }
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  requireAdmin(req, res, next);

  assert.equal(statusCode, 403);
  assert.equal(payload.message, "Admin access required");
  assert.equal(nextCalled, false);
});
