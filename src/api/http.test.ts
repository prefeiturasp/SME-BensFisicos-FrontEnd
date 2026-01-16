import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api, setAuthToken, getAuthToken } from './http';

describe('http api', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    setAuthToken(null);
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('deve definir e obter o token de autenticação', () => {
    setAuthToken('abc-123');
    expect(getAuthToken()).toBe('abc-123');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer abc-123');

    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('deve injetar token no header da requisição via interceptor', async () => {
    setAuthToken('test-token');
    mock.onGet('/test').reply(200);

    await api.get('/test');

    expect(mock.history.get[0].headers?.Authorization).toBe('Bearer test-token');
  });

  it('deve rejeitar erros response != 401 normalmente', async () => {
    mock.onGet('/error').reply(500);

    await expect(api.get('/error')).rejects.toThrow();
  });

  it('deve rejeitar 401 em rotas de login/refresh/logout sem tentar refresh', async () => {
    mock.onPost('/auth/login/').reply(401);

    await expect(api.post('/auth/login/')).rejects.toThrow();
    const history = mock.history.post.find((req) => req.url === '/auth/token/refresh/');
    expect(history).toBeUndefined();
  });

  it('deve tentar refresh token ao receber 401 estático', async () => {
    mock.onGet('/protected').replyOnce(401);
    mock.onPost('/auth/token/refresh/').reply(200, { access: 'new-access-token' });
    mock.onGet('/protected').reply(200, { data: 'success' });

    const response = await api.get('/protected');

    expect(response.status).toBe(200);
    expect(getAuthToken()).toBe('new-access-token');
    expect(mock.history.post.find((req) => req.url === '/auth/token/refresh/')).toBeDefined();
  });

  it('deve fazer logout e rejeitar request se refresh falhar', async () => {
    mock.onGet('/protected').replyOnce(401);
    mock.onPost('/auth/token/refresh/').reply(401);

    await expect(api.get('/protected')).rejects.toThrow();

    expect(getAuthToken()).toBeNull();
  });

  it('deve enfileirar múltiplas requisições enquanto o refresh acontece', async () => {
    mock.onGet('/p1').replyOnce(401);
    mock.onGet('/p2').replyOnce(401);

    mock.onPost('/auth/token/refresh/').reply(async () => {
      await new Promise((r) => setTimeout(r, 100));
      return [200, { access: 'queued-token' }];
    });

    mock.onGet('/p1').reply(200, 'ok1');
    mock.onGet('/p2').reply(200, 'ok2');

    const [res1, res2] = await Promise.all([api.get('/p1'), api.get('/p2')]);

    expect(res1.data).toBe('ok1');
    expect(res2.data).toBe('ok2');
    expect(getAuthToken()).toBe('queued-token');

    const refreshCalls = mock.history.post.filter((req) => req.url === '/auth/token/refresh/');
    expect(refreshCalls.length).toBe(1);
  });
});
