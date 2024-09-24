import { expect, test, describe } from 'bun:test';

import { app } from './server';

describe('Server', () => {
  // -----------------------------------------------------------------------------------------------
  test('Health Check - GET /', async () => {
    const res = await app.request('/');

    expect(res.status).toBe(200);
    expect(await res.text()).toEqual('Hello World!');
  });
  // -----------------------------------------------------------------------------------------------
});
