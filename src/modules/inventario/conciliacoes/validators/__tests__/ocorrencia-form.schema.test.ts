import { describe, expect, it } from 'vitest';
import { ocorrenciaFormSchema } from '../ocorrencia-form.schema';

describe('ocorrenciaFormSchema', () => {
  it('valida formulario com situacao e observacao', () => {
    const result = ocorrenciaFormSchema.safeParse({
      situacao: 'encontrado',
      observacao: 'observacao',
    });

    expect(result.success).toBe(true);
  });

  it('rejeita formulario sem situacao', () => {
    const result = ocorrenciaFormSchema.safeParse({
      situacao: '',
      observacao: 'observacao',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita situacao "divergente" sem descricao', () => {
    const result = ocorrenciaFormSchema.safeParse({
      situacao: 'divergente',
      divergencia: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita situacao "divergente" com descricao apenas em espacos', () => {
    const result = ocorrenciaFormSchema.safeParse({
      situacao: 'divergente',
      divergencia: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('aceita situacao "divergente" com descricao', () => {
    const result = ocorrenciaFormSchema.safeParse({
      situacao: 'divergente',
      divergencia: 'detalhes',
    });

    expect(result.success).toBe(true);
  });
});
