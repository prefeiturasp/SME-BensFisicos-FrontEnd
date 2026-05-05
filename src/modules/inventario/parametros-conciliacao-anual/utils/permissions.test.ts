import { describe, expect, it } from 'vitest';
import { canAccessParametrosConciliacao } from './permissions';

describe('canAccessParametrosConciliacao', () => {
  it('permite superusuario e gestor de patrimonio', () => {
    expect(canAccessParametrosConciliacao({ is_superuser: true })).toBe(true);
    expect(canAccessParametrosConciliacao({ is_gestor_patrimonio: true })).toBe(true);
  });

  it('bloqueia operador e usuario sem perfil permitido', () => {
    expect(canAccessParametrosConciliacao({})).toBe(false);
    expect(canAccessParametrosConciliacao(null)).toBe(false);
  });
});
