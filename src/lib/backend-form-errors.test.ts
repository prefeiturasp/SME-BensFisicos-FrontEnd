import { describe, expect, it } from 'vitest';

import { extractErrorMessage } from './backend-form-errors';

describe('backend-form-errors', () => {
  it('preserva todas as mensagens retornadas para o mesmo campo', () => {
    expect(extractErrorMessage(['Campo obrigatório.', 'Formato inválido.'])).toBe(
      'Campo obrigatório. Formato inválido.',
    );
  });

  it('mantém compatibilidade com mensagem simples', () => {
    expect(extractErrorMessage('Mensagem simples.')).toBe('Mensagem simples.');
  });

  it('preserva mensagens em estruturas aninhadas', () => {
    expect(
      extractErrorMessage({
        item: ['Bem inválido.'],
        localizacao: ['Localização obrigatória.'],
      }),
    ).toBe('Bem inválido. Localização obrigatória.');
  });
});
