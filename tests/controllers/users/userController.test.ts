import request from 'supertest';

import { server, serverInitialised } from '../../../src';
import { exportedTestUser, testUserCredentials } from './_testdata';
import { authoriseTestUser } from './utils';

describe('Test User Endpoints', () => {
  let authToken: string = '';

  beforeAll(async () => {
    await serverInitialised;
    authToken = await authoriseTestUser();
    expect(authToken).toBeTruthy();
  });

  it('Can CREATE a user, with appropriately exported response', async () => {
    const response = await request(server).post('/createUser').send(testUserCredentials);

    expect(response.status).toBe(201);
    expect(response.body.user).toBe(exportedTestUser);
  });

  it('Prevents a CREATE on an already existing user_id', async () => {
    const response = await request(server).post('/createUser').send(testUserCredentials);

    expect(response.status).toBe(400);
  });

  it('Can UPDATE own user data', async () => {
    const response = await request(server)
      .post('/updateMe')
      .set('Authorization', authToken)
      .send({ ...exportedTestUser, display_name: 'bitch lettuce' });

    expect(response.status).toBe(200);
    expect(response.body).toBe({
      ...exportedTestUser,
      display_name: 'bitch lettuce'
    });
  });

  it('Can GET an existing user', async () => {
    const response = await request(server)
      .get(`/getUser?user_id=${exportedTestUser.user_id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body).toBe({
      ...exportedTestUser,
      display_name: 'bitch lettuce'
    });
  });

  it('Can DELETE myself', async () => {
    const response = await request(server)
      .post('/deleteMe')
      .set('Authorization', authToken)
      .send({ password: testUserCredentials.password });

    expect(response.status).toBe(200);
  });

  it('Cannot GET a non-existing user (deletion actually works)', async () => {
    const response = await request(server)
      .get(`/getUser?user_id=${exportedTestUser.user_id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(404);
  });
});
