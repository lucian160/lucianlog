const test = require("node:test");
const assert = require("node:assert/strict");

const { validateLogPayload } = require("../utils/logValidators");

test("validateLogPayload accepts a supported log payload", () => {
  assert.deepEqual(validateLogPayload({
    level: "error",
    message: "Payment failed",
    statusCode: 500,
    metadata: { orderId: "order-123" }
  }), []);
});

test("validateLogPayload rejects unsafe or malformed fields", () => {
  const errors = validateLogPayload({
    level: "debug",
    message: "",
    statusCode: 999,
    metadata: "not-an-object"
  });

  assert.deepEqual(errors.map((error) => error.field), [
    "message",
    "level",
    "statusCode",
    "metadata"
  ]);
});