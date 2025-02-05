import request from 'supertest';

import { server, serverInitialised } from '../../../src/index';
import { authoriseTestUser } from '../users/utils';
import { testNoteCreation, testNoteExport } from './_factory';

describe('Test Note Endpoints', () => {
  let authToken: string = '';
  let createdId: string = '';

  beforeAll(async () => {
    await serverInitialised;
    authToken = await authoriseTestUser();
    expect(authToken).toBeTruthy();
  });

  it('Can CREATE a note, with appropriately exported response', async () => {
    const response = await request(server)
      .post('/createNote')
      .set('Authorization', authToken)
      .send(testNoteCreation);

    expect(response.status).toBe(201);
    expect(response.body).toBe(testNoteExport);
    createdId = response.body.id;
  });

  it('Is idempotent for note UPDATE operations', async () => {
    const response = await request(server)
      .post('/updateNote')
      .set('Authorization', authToken)
      .send(testNoteCreation);

    expect(response.status).toBe(200);
    expect(response.body).toBe(testNoteExport);
  });

  it('Applies note UPDATE and returns appropriate change', async () => {
    const response = await request(server)
      .post('/updateNote')
      .set('Authorization', authToken)
      .send({ id: testNoteExport.id, title: 'my modified list' });

    expect(response.status).toBe(200);
    expect(response.body).toBe({
      ...testNoteExport,
      title: 'my modified list'
    });

    // Change it back for later tests. May as well test this too
    const secondResponse = await request(server)
      .post('/updateNote')
      .set('Authorization', authToken)
      .send(testNoteExport);

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body).toBe(testNoteExport);
  });

  it('Can GET an note, with the appropriate response', async () => {
    const response = await request(server)
      .get(`/getNote?id=${testNoteExport.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
    expect(response.body).toBe(testNoteExport);
  });

  it('Can DELETE an note, with the appropriate response', async () => {
    const response = await request(server)
      .get(`/deleteNote?id=${testNoteExport.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(200);
  });

  it('Cannot GET a deleted note', async () => {
    const response = await request(server)
      .get(`/getNote?id=${testNoteExport.id}`)
      .set('Authorization', authToken);

    expect(response.status).toBe(404);
  });
});
