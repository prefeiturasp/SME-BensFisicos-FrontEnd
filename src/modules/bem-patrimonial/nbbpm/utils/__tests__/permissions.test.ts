import { describe, expect, it } from 'vitest';

import { canAccessNbbpm, canReemitirNbbpm } from '../permissions';

describe('canAccessNbbpm', () => {
  it('permite Gestor de Patrimônio', () => {
    expect(canAccessNbbpm({ is_gestor_patrimonio: true })).toBe(true);
  });

  it('permite superusuário', () => {
    expect(canAccessNbbpm({ is_superuser: true, is_gestor_patrimonio: false })).toBe(true);
  });

  it('nega demais perfis (ex.: operador de inventário)', () => {
    expect(canAccessNbbpm({ is_superuser: false, is_gestor_patrimonio: false })).toBe(false);
  });

  it('nega usuário ausente', () => {
    expect(canAccessNbbpm(null)).toBe(false);
    expect(canAccessNbbpm(undefined)).toBe(false);
  });
});

describe('canReemitirNbbpm', () => {
  it('permite Gestor de Patrimônio e superusuário', () => {
    expect(canReemitirNbbpm({ is_gestor_patrimonio: true })).toBe(true);
    expect(canReemitirNbbpm({ is_superuser: true })).toBe(true);
  });

  it('nega demais perfis e usuário ausente', () => {
    expect(canReemitirNbbpm({ is_gestor_patrimonio: false, is_superuser: false })).toBe(false);
    expect(canReemitirNbbpm(null)).toBe(false);
  });

  it('respeita a regra de processo informada pelo backend', () => {
    const gestor = { is_gestor_patrimonio: true };

    expect(canReemitirNbbpm(gestor, { pode_reemitir: false })).toBe(false);
    expect(canReemitirNbbpm(gestor, { pode_reemitir: true })).toBe(true);
    expect(canReemitirNbbpm(gestor, {})).toBe(true);
  });
});
