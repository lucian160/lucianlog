const test = require('node:test');
const assert = require('node:assert/strict');

const { buildLogFilter } = require('../utils/logQuery');

test('buildLogFilter includes project id and search terms', () => {
  const filter = buildLogFilter({
    projectId: 'project-123',
    level: 'error',
    statusCode: '500',
    search: 'timeout'
  });

  assert.deepEqual(filter, {
    projectId: 'project-123',
    level: 'error',
    statusCode: 500,
    $or: [
      { message: /timeout/i },
      { endpoint: /timeout/i },
      { method: /timeout/i },
      { stack: /timeout/i }
    ]
  });
});

test('buildLogFilter ignores empty values', () => {
  const filter = buildLogFilter({
    projectId: 'project-456',
    level: '',
    statusCode: '',
    search: '   '
  });

  assert.deepEqual(filter, {
    projectId: 'project-456'
  });
});
