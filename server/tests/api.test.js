import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('API Security and Routing Test Suite', () => {
  it('returns healthy status on public GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.ok(res.body.system.includes('Med-Guard AI'));
  });

  it('rejects unauthenticated requests to protected route GET /api/patients with 401', async () => {
    const res = await request(app).get('/api/patients');
    assert.strictEqual(res.status, 401);
    assert.match(res.body.error, /Authentication required/i);
  });

  it('rejects unauthenticated requests to POST /api/analysis with 401', async () => {
    const res = await request(app)
      .post('/api/analysis')
      .send({
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        newMedications: [{ name: 'Aspirin' }]
      });
    assert.strictEqual(res.status, 401);
  });

  it('returns 404 for unknown API endpoints', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    assert.strictEqual(res.status, 404);
  });
});
