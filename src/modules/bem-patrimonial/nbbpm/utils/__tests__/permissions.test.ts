import { describe, expect, it } from 'vitest';

import { canAccessNbbpm } from '../permissions';

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
