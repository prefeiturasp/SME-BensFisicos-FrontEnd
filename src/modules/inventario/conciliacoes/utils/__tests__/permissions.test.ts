import { describe, expect, it } from 'vitest';
import { canAccessConciliacoes } from '../permissions';

describe('canAccessConciliacoes', () => {
  it('permite superusuario', () => {
    expect(canAccessConciliacoes({ is_superuser: true })).toBe(true);
  });

  it('permite gestor de patrimonio', () => {
    expect(canAccessConciliacoes({ is_gestor_patrimonio: true })).toBe(true);
  });

  it('permite operador de inventario', () => {
    expect(canAccessConciliacoes({ is_operador_inventario: true })).toBe(true);
  });

  it('bloqueia usuario sem perfil', () => {
    expect(canAccessConciliacoes({})).toBe(false);
  });

  it('bloqueia null/undefined', () => {
    expect(canAccessConciliacoes(null)).toBe(false);
    expect(canAccessConciliacoes(undefined)).toBe(false);
  });
});
