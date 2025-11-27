// tests/items.test.js
const request = require('supertest');
const fs = require('fs');
const path = require('path');

process.env.DB_FILE = path.join(__dirname, 'testdata.sqlite');
process.env.JWT_SECRET = 'test-secret';

let app;
beforeAll(async () => {
  try { fs.unlinkSync(process.env.DB_FILE); } catch (e) {}
  app = require('../app');
  await new Promise(res => setTimeout(res, 200));
});

afterAll(async () => {
  try { fs.unlinkSync(process.env.DB_FILE); } catch (e) {}
});

describe('Items & search', () => {
  let token;
  beforeAll(async () => {
    const agent = request(app);
    const username = `itemuser_${Date.now()}`;
    await agent.post('/auth/register').send({ username, password: 'pw' }).expect(201);
    const login = await agent.post('/auth/login').send({ username, password: 'pw' }).expect(200);
    token = login.body.token;
  });

  test('create item and search it', async () => {
    const agent = request(app);
    const newItem = { title: 'Recycle Bin', description: 'A place to toss trash art' };
    const createRes = await agent.post('/items').set('Authorization', `Bearer ${token}`).send(newItem).expect(201);
    expect(createRes.body.title).toBe(newItem.title);

    // search by keyword
    const search = await agent.get('/items/search').query({ q: 'recycle' }).expect(200);
    expect(search.body.results.length).toBeGreaterThanOrEqual(1);
    expect(search.body.results[0]).toHaveProperty('title');
  });

  test('dashboard metrics', async () => {
    const agent = request(app);
    const dash = await agent.get('/dashboard').set('Authorization', `Bearer ${token}`).expect(200);
    expect(dash.body).toHaveProperty('totalItems');
    expect(dash.body).toHaveProperty('myItems');
  });
});
