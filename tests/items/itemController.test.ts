import request from 'supertest';

import { server, serverInitialised } from '../../src/index';
import { authoriseTestUser } from '../users/utils';
import { testDatedItemCreate, testDatedItemExport } from './_testdata';

describe('Test Item Endpoints', () => {
  let authToken: string = '';
  let createdId: string = '';

  beforeAll(async () => {
    await serverInitialised;
    authToken = await authoriseTestUser();
    expect(authToken).toBeTruthy();
  });

  it('Can CREATE an item, with appropriately exported response', async () => {
    const response = await request(server)
      .post('/createItem')
      .set('Authorization', authToken)
      .send(testDatedItemCreate);

    expect(response.status).toBe(201);
    expect(response.body).toBe(testDatedItemExport);
    createdId = response.body.id;
  });

  it('Is idempotent for item UPDATE operations', async () => {
    const response = await request(server)
      .post('/updateItem')
      .set('Authorization', authToken)
      .send(testDatedItemCreate);

    expect(response.status).toBe(200);
    expect(response.body).toBe(testDatedItemExport);
  });

  it('Applies item UPDATE and returns appropriate change', async () => {
    const response = await request(server)
      .post('/updateItem')
      .set('Authorization', authToken)
      .send({ id: testDatedItemExport.id, title: 'my modified list' });

    expect(response.status).toBe(200);
    expect(response.body).toBe({
      ...testDatedItemExport,
      title: 'my modified list'
    });

    // Change it back for later tests. May as well test this too
    const secondResponse = await request(server)
      .post('/updateItem')
      .set('Authorization', authToken)
      .send(testDatedItemExport);

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body).toBe(testDatedItemExport);
  });

  it('Can GET an item, with the appropriate response', async () => {
    const response = await request(server)
      .get(`/getItem?id=${testDatedItemExport.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body).toBe(testDatedItemExport);
  });

  it('Can DELETE an item, with the appropriate response', async () => {
    const response = await request(server)
      .get(`/deleteItem?id=${testDatedItemExport.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
  });

  it('Cannot GET a deleted item', async () => {
    const response = await request(server)
      .get(`/getItem?id=${testDatedItemExport.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(404);
  });
});
