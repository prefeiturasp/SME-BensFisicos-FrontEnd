import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEscopoStorage,
  getEscopoStorage,
  setEscopoStorage,
  type EscopoStorage,
} from './escopo-storage';

const STORAGE_KEY = 'escopo-ativo';

function mockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
}

describe('escopo-storage', () => {
  beforeEach(() => {
    const storage = mockStorage();
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
    });
  });

  it('deve salvar e recuperar escopo', () => {
    const payload: EscopoStorage = { uoId: 1, uaId: 2 };
    setEscopoStorage(payload);

    expect(getEscopoStorage()).toEqual(payload);
  });

  it('deve limpar storage quando escopo vazio', () => {
    setEscopoStorage({ uoId: 1, uaId: 2 });
    setEscopoStorage({ uoId: null, uaId: null });

    expect(getEscopoStorage()).toBeNull();
  });

  it('deve limpar storage via clear', () => {
    setEscopoStorage({ uoId: 10, uaId: 20 });

    clearEscopoStorage();

    expect(getEscopoStorage()).toBeNull();
  });

  it('deve ignorar json invalido', () => {
    window.localStorage.setItem(STORAGE_KEY, '{invalid}');

    expect(getEscopoStorage()).toBeNull();
  });

  it('deve normalizar valores invalidos', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ uoId: 'x', uaId: 2 }));

    expect(getEscopoStorage()).toEqual({ uoId: null, uaId: 2 });
  });

  it('deve retornar null se storage indisponivel', () => {
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new Error('sem acesso');
      },
      configurable: true,
    });

    expect(getEscopoStorage()).toBeNull();
  });
});
