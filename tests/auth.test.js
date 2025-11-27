// tests/auth.test.js
const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Use a temporary DB file for tests
process.env.DB_FILE = path.join(__dirname, 'testdata.sqlite');
process.env.JWT_SECRET = 'test-secret';

let app;
beforeAll(async () => {
  // Remove old test DB
  try { fs.unlinkSync(process.env.DB_FILE); } catch (e) {}
  app = require('../app'); // app starts and creates DB
  // wait briefly for server to be ready (app listens synchronously after init in our script)
  await new Promise(res => setTimeout(res, 200));
});

afterAll(async () => {
  // Cleanup DB
  try { fs.unlinkSync(process.env.DB_FILE); } catch (e) {}
});

describe('Auth endpoints', () => {
  test('register -> login -> get token', async () => {
    const agent = request(app);
    const username = `user_${Date.now()}`;
    const registerRes = await agent.post('/auth/register').send({ username, password: 'pass1234' }).expect(201);
    expect(registerRes.body).toHaveProperty('id');
    const loginRes = await agent.post('/auth/login').send({ username, password: 'pass1234' }).expect(200);
    expect(loginRes.body).toHaveProperty('token');
  });

  test('login with wrong password fails', async () => {
    const agent = request(app);
    const username = `user2_${Date.now()}`;
    await agent.post('/auth/register').send({ username, password: 'abc' }).expect(201);
    await agent.post('/auth/login').send({ username, password: 'wrong' }).expect(401);
  });
});
