const assert = require('node:assert/strict');
const http = require('node:http');
const { after, before, beforeEach, describe, test } = require('node:test');
const mongoose = require('mongoose');

const app = require('../src/app');
const Todo = require('../src/models/Todo');

const records = new Map();
const originalModelMethods = {
  create: Todo.create,
  find: Todo.find,
  findById: Todo.findById,
  findByIdAndUpdate: Todo.findByIdAndUpdate,
  findByIdAndDelete: Todo.findByIdAndDelete
};

let server;
let port;

const cloneTodo = (todo) => new Todo(todo.toObject());

const installInMemoryModel = () => {
  Todo.create = async (attributes) => {
    const todo = new Todo(attributes);
    const now = new Date();

    todo.createdAt = now;
    todo.updatedAt = now;
    await todo.validate();
    records.set(todo.id, todo);

    return cloneTodo(todo);
  };

  Todo.find = async () => Array.from(records.values(), cloneTodo);

  Todo.findById = async (id) => {
    const todo = records.get(String(id));
    return todo ? cloneTodo(todo) : null;
  };

  Todo.findByIdAndUpdate = async (id, updates, options = {}) => {
    const current = records.get(String(id));

    if (!current) {
      return null;
    }

    const updated = cloneTodo(current);
    Object.assign(updated, updates);
    updated.updatedAt = new Date();

    if (options.runValidators) {
      await updated.validate();
    }

    records.set(updated.id, updated);
    return options.new ? cloneTodo(updated) : cloneTodo(current);
  };

  Todo.findByIdAndDelete = async (id) => {
    const todo = records.get(String(id));

    if (!todo) {
      return null;
    }

    records.delete(String(id));
    return cloneTodo(todo);
  };
};

const restoreModel = () => {
  Object.assign(Todo, originalModelMethods);
};

const startServer = () =>
  new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1');
    server.once('error', reject);
    server.once('listening', () => {
      port = server.address().port;
      resolve();
    });
  });

const stopServer = () =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const request = (method, path, body, { raw = false } = {}) =>
  new Promise((resolve, reject) => {
    const payload =
      body === undefined ? undefined : raw ? body : JSON.stringify(body);
    const headers = {};

    if (payload !== undefined) {
      headers['content-type'] = 'application/json';
      headers['content-length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method,
        headers,
        agent: false
      },
      (res) => {
        const chunks = [];

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const isJson = res.headers['content-type']?.includes('application/json');

          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: isJson && text ? JSON.parse(text) : text
          });
        });
      }
    );

    req.once('error', reject);
    req.end(payload);
  });

const createTodo = (overrides = {}) =>
  request('POST', '/todos', {
    title: 'Write integration tests',
    description: 'Cover the complete API contract.',
    ...overrides
  });

describe('Simple Todo API', { concurrency: false }, () => {
  before(async () => {
    installInMemoryModel();
    await startServer();
  });

  beforeEach(() => {
    records.clear();
  });

  after(async () => {
    restoreModel();
    await stopServer();
  });

  test('GET /health reports that the API is healthy', async () => {
    const response = await request('GET', '/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      message: 'API is healthy.'
    });
  });

  test('POST /todos creates a todo, applies defaults, and ignores unknown fields', async () => {
    const response = await request('POST', '/todos', {
      title: '  Ship the API  ',
      unexpected: 'must not be persisted'
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.title, 'Ship the API');
    assert.equal(response.body.data.description, '');
    assert.equal(response.body.data.completed, false);
    assert.match(response.body.data._id, /^[a-f\d]{24}$/i);
    assert.equal(response.body.data.unexpected, undefined);
  });

  test('GET /todos returns every todo and an accurate count', async () => {
    await createTodo({ title: 'First todo' });
    await createTodo({ title: 'Second todo', completed: true });

    const response = await request('GET', '/todos');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.count, 2);
    assert.deepEqual(
      response.body.data.map((todo) => todo.title),
      ['First todo', 'Second todo']
    );
  });

  test('GET, PUT, and DELETE /todos/:id complete the item lifecycle', async () => {
    const created = await createTodo();
    const id = created.body.data._id;

    const fetched = await request('GET', `/todos/${id}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.data.title, 'Write integration tests');

    const updated = await request('PUT', `/todos/${id}`, {
      title: 'Tests complete',
      completed: true,
      ignored: 'not allowed'
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, 'Tests complete');
    assert.equal(updated.body.data.completed, true);
    assert.equal(updated.body.data.ignored, undefined);

    const deleted = await request('DELETE', `/todos/${id}`);
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.success, true);
    assert.equal(deleted.body.message, 'Todo deleted successfully.');
    assert.equal(deleted.body.data._id, id);

    const missing = await request('GET', `/todos/${id}`);
    assert.equal(missing.status, 404);
    assert.equal(missing.body.success, false);
    assert.equal(missing.body.message, 'Todo not found.');
  });

  test('POST /todos returns structured validation errors', async (t) => {
    const cases = [
      { name: 'missing title', body: {}, field: 'title' },
      { name: 'blank title', body: { title: '   ' }, field: 'title' },
      { name: 'overlong title', body: { title: 'x'.repeat(201) }, field: 'title' },
      {
        name: 'overlong description',
        body: { title: 'Valid title', description: 'x'.repeat(2001) },
        field: 'description'
      }
    ];

    for (const testCase of cases) {
      await t.test(testCase.name, async () => {
        const response = await request('POST', '/todos', testCase.body);

        assert.equal(response.status, 400);
        assert.equal(response.body.success, false);
        assert.equal(response.body.message, 'Validation failed.');
        assert.ok(
          response.body.errors.some((error) => error.field === testCase.field)
        );
      });
    }
  });

  test('PUT /todos/:id validates updates and rejects empty supported updates', async () => {
    const created = await createTodo();
    const id = created.body.data._id;

    const invalid = await request('PUT', `/todos/${id}`, { title: '   ' });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.message, 'Validation failed.');
    assert.ok(invalid.body.errors.some((error) => error.field === 'title'));

    const empty = await request('PUT', `/todos/${id}`, {
      unknown: 'ignored'
    });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.success, false);
    assert.match(empty.body.message, /at least one/i);
  });

  test('item routes reject malformed ids before querying the model', async (t) => {
    const cases = [
      { method: 'GET' },
      { method: 'PUT', body: { completed: true } },
      { method: 'DELETE' }
    ];

    for (const testCase of cases) {
      await t.test(testCase.method, async () => {
        const response = await request(
          testCase.method,
          '/todos/not-an-object-id',
          testCase.body
        );

        assert.equal(response.status, 400);
        assert.equal(response.body.success, false);
        assert.equal(response.body.message, 'Invalid todo id.');
      });
    }
  });

  test('item routes return 404 for valid ids that do not exist', async (t) => {
    const id = new mongoose.Types.ObjectId().toString();
    const cases = [
      { method: 'GET' },
      { method: 'PUT', body: { completed: true } },
      { method: 'DELETE' }
    ];

    for (const testCase of cases) {
      await t.test(testCase.method, async () => {
        const response = await request(
          testCase.method,
          `/todos/${id}`,
          testCase.body
        );

        assert.equal(response.status, 404);
        assert.equal(response.body.success, false);
        assert.equal(response.body.message, 'Todo not found.');
      });
    }
  });

  test('malformed JSON and unknown routes use the JSON error contract', async () => {
    const malformed = await request('POST', '/todos', '{"title":', {
      raw: true
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(malformed.body, {
      success: false,
      message: 'Request body contains invalid JSON.'
    });

    const unknown = await request('GET', '/does-not-exist');
    assert.equal(unknown.status, 404);
    assert.equal(unknown.body.success, false);
    assert.match(unknown.body.message, /route not found/i);
  });
});
