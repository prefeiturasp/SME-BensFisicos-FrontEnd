export type EscopoStorage = {
  uoId: number | null;
  uaId: number | null;
};

const STORAGE_KEY = 'escopo-ativo';

function canUseStorage(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const storage = window.localStorage;
    const testKey = '__escopo_test__';
    storage.setItem(testKey, 'ok');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function normalizeId(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

export function getEscopoStorage(): EscopoStorage | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<EscopoStorage>;
    const escopo = {
      uoId: normalizeId(parsed.uoId),
      uaId: normalizeId(parsed.uaId),
    };

    if (!escopo.uoId && !escopo.uaId) return null;

    return escopo;
  } catch {
    return null;
  }
}

export function setEscopoStorage(escopo: EscopoStorage) {
  if (!canUseStorage()) return;

  if (!escopo.uoId && !escopo.uaId) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      uoId: escopo.uoId ?? null,
      uaId: escopo.uaId ?? null,
    }),
  );
}

export function clearEscopoStorage() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
