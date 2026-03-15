const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');

// Re-require server fresh for tests by clearing require cache
delete require.cache[require.resolve('./server')];
const app = require('./server');

const request = supertest(app);

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request.get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});

describe('GET /api/items', () => {
  it('returns an array', async () => {
    const res = await request.get('/api/items');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
});

describe('POST /api/items', () => {
  it('creates a new item', async () => {
    const res = await request
      .post('/api/items')
      .send({ title: 'Test item' })
      .set('Content-Type', 'application/json');
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Test item');
    assert.equal(res.body.completed, false);
    assert.ok(res.body.id);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request
      .post('/api/items')
      .send({})
      .set('Content-Type', 'application/json');
    assert.equal(res.status, 400);
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request
      .post('/api/items')
      .send({ title: '   ' })
      .set('Content-Type', 'application/json');
    assert.equal(res.status, 400);
  });
});

describe('PUT /api/items/:id', () => {
  it('updates completed status', async () => {
    // Create item first
    const create = await request
      .post('/api/items')
      .send({ title: 'Update me' })
      .set('Content-Type', 'application/json');
    const id = create.body.id;

    const res = await request
      .put(`/api/items/${id}`)
      .send({ completed: true })
      .set('Content-Type', 'application/json');
    assert.equal(res.status, 200);
    assert.equal(res.body.completed, true);
  });

  it('returns 404 for non-existent item', async () => {
    const res = await request
      .put('/api/items/99999')
      .send({ completed: true })
      .set('Content-Type', 'application/json');
    assert.equal(res.status, 404);
  });
});

describe('DELETE /api/items/:id', () => {
  it('deletes an existing item', async () => {
    const create = await request
      .post('/api/items')
      .send({ title: 'Delete me' })
      .set('Content-Type', 'application/json');
    const id = create.body.id;

    const res = await request.delete(`/api/items/${id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, id);
  });

  it('returns 404 for non-existent item', async () => {
    const res = await request.delete('/api/items/99999');
    assert.equal(res.status, 404);
  });
});
