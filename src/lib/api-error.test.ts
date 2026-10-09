import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { extractApiErrorMessage, handleApiError } from './api-error'

describe('api-error', () => {
  it('preserva mensagens de todos os campos e estruturas aninhadas', () => {
    expect(
      extractApiErrorMessage({
        nome: ['Nome obrigatório.'],
        linhas: [{ localizacao: ['Localização obrigatória.'] }],
      }),
    ).toBe('Nome obrigatório. Localização obrigatória.')
  })

  it('lança todas as mensagens retornadas pela API', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      status: 400,
      statusText: '400',
      headers: {},
      data: { nome: ['Nome obrigatório.'], descricao: ['Descrição obrigatória.'] },
      config: { headers: new AxiosHeaders() },
    }

    expect(() => handleApiError(error, 'Erro padrão.')).toThrow(
      'Nome obrigatório. Descrição obrigatória.',
    )
  })
})
