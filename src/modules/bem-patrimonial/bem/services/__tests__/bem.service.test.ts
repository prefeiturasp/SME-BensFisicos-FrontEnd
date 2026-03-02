import { describe, it, expect, beforeEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { api } from '@/api/http'
import { bemService } from '../bem.service'
import { AxiosError } from 'axios'

const mock = new MockAdapter(api)

describe('bem.service', () => {
  beforeEach(() => {
    mock.reset()
  })

  const fakeBem = {
    id: 1,
    status: 'aprovado',
    status_display: 'Aprovado',
    nome: 'Notebook',
    descricao: 'Teste',
    numero_patrimonial: '123',
    localizacao: 'Sala 1',
    unidade_administrativa_codigo: '001',
    unidade_administrativa_nome: 'Admin',
    unidade_orcamentaria_nome: 'Financeiro',
  }

  // ===============================
  // LIST
  // ===============================

  it('deve listar bens com parâmetros corretamente', async () => {
    mock
      .onGet(/\/bens\/\?/)
      .reply(config => {
        expect(config.url).toContain('page=1')
        expect(config.url).toContain('search=Notebook')
        expect(config.url).toContain('status=aprovado')
        expect(config.url).toContain('unidade_administrativa=001')
        expect(config.url).toContain('ordering=nome')

        return [
          200,
          {
            count: 1,
            next: null,
            previous: null,
            results: [fakeBem],
          },
        ]
      })

    const result = await bemService.list({
      page: 1,
      search: '  Notebook  ',
      status: 'aprovado',
      unidade_administrativa: '001',
      ordering: 'nome',
    } as any)

    expect(result.count).toBe(1)
    expect(result.results[0].id).toBe(1)
  })

  it('não deve enviar status quando for "todos"', async () => {
    mock.onGet(/\/bens\/\?/).reply(config => {
      expect(config.url).not.toContain('status=')
      return [200, { count: 0, next: null, previous: null, results: [] }]
    })

    await bemService.list({ status: 'todos' } as any)
  })

  it('não deve enviar unidade_administrativa quando for "todas"', async () => {
    mock.onGet(/\/bens\/\?/).reply(config => {
      expect(config.url).not.toContain('unidade_administrativa=')
      return [200, { count: 0, next: null, previous: null, results: [] }]
    })

    await bemService.list({ unidade_administrativa: 'todas' } as any)
  })

  // ===============================
  // RETRIEVE
  // ===============================

  it('deve buscar um bem por id', async () => {
    mock.onGet('/bens/1/').reply(200, fakeBem)

    const result = await bemService.retrieve(1)
    expect(result.id).toBe(1)
  })

  // ===============================
  // UPDATE
  // ===============================

  it('deve atualizar um bem', async () => {
    mock.onPut('/bens/1/').reply(config => {
      const payload = JSON.parse(config.data)
      expect(payload.nome).toBe('Novo Nome')
      return [200, { ...fakeBem, nome: 'Novo Nome' }]
    })

    const result = await bemService.update(1, { nome: 'Novo Nome' })
    expect(result.nome).toBe('Novo Nome')
  })

  // ===============================
  // APROVAR
  // ===============================

  it('deve aprovar bens', async () => {
    mock.onPost('/bens/aprovar/').reply(config => {
      const body = JSON.parse(config.data)
      expect(body.ids).toEqual([1, 2])
      return [200]
    })

    await expect(bemService.aprovar([1, 2])).resolves.toBeUndefined()
  })

  // ===============================
  // REPROVAR
  // ===============================

  it('deve reprovar bens', async () => {
    mock.onPost('/bens/reprovar/').reply(config => {
      const body = JSON.parse(config.data)
      expect(body.ids).toEqual([3])
      return [200]
    })

    await expect(bemService.reprovar([3])).resolves.toBeUndefined()
  })

  // ===============================
  // HISTÓRICO
  // ===============================

  it('deve buscar histórico do bem', async () => {
    mock.onGet('/bens/1/historico/').reply(200, [{ alterado_em: 'hoje' }])

    const result = await bemService.getHistorico(1)
    expect(result).toHaveLength(1)
  })

  // ===============================
  // ERROS (handleApiError)
  // ===============================

  it('deve lançar erro com detail da API', async () => {
    const axiosError = new AxiosError(
        'Erro qualquer',
        '400',
        undefined,
        undefined,
        {
        data: { detail: 'Erro customizado' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {},
        } as any
    )

    vi.spyOn(api, 'get').mockRejectedValueOnce(axiosError)

    await expect(bemService.retrieve(1)).rejects.toThrow('Erro customizado')
})

  it('deve lançar erro padrão quando não houver detail', async () => {
    const axiosError = new AxiosError(
        'Erro qualquer',
        '500',
        undefined,
        undefined,
        {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
        } as any
    )

    vi.spyOn(api, 'get').mockRejectedValueOnce(axiosError)

    await expect(bemService.retrieve(1)).rejects.toThrow(
        'Erro ao buscar detalhes do bem'
    )
    })

  
  it('deve lançar erro de conexão quando não houver response', async () => {
    const axiosError = new AxiosError('Network Error')

    vi.spyOn(api, 'get').mockRejectedValueOnce(axiosError)

    await expect(bemService.retrieve(1)).rejects.toThrow(
        'Erro de conexão com o servidor.'
    )
   })

  it('deve relançar erro desconhecido', async () => {
    const spy = vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Erro estranho'))

    await expect(bemService.retrieve(1)).rejects.toThrow('Erro estranho')

    spy.mockRestore()
  })

    // ===============================
    // CREATE MULTI
    // ===============================

    it('deve criar múltiplos bens', async () => {
    mock.onPost('/bens/multi/').reply(config => {
        const body = JSON.parse(config.data)
        expect(body.nome).toBe('Notebook')
        return [200]
    })

    await expect(
        bemService.createMulti({ nome: 'Notebook' })
    ).resolves.toBeUndefined()
    })

    it('deve lançar erro ao falhar createMulti', async () => {
    const axiosError = new AxiosError(
        'Erro qualquer',
        '500',
        undefined,
        undefined,
        {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
        } as any
    )

    vi.spyOn(api, 'post').mockRejectedValueOnce(axiosError)

    await expect(
        bemService.createMulti({})
    ).rejects.toThrow('Erro ao criar bens')
    })

    // ===============================
    // ERRO EM LIST
    // ===============================

    it('deve lançar erro ao falhar list', async () => {
    const axiosError = new AxiosError(
        'Erro qualquer',
        '500',
        undefined,
        undefined,
        {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
        } as any
    )

    vi.spyOn(api, 'get').mockRejectedValueOnce(axiosError)

    await expect(
        bemService.list({})
    ).rejects.toThrow('Erro ao listar bens')
    })

    // ===============================
    // ERRO EM UPDATE
    // ===============================

    it('deve lançar erro ao falhar update', async () => {
    const axiosError = new AxiosError(
        'Erro qualquer',
        '500',
        undefined,
        undefined,
        {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
        } as any
    )

    vi.spyOn(api, 'put').mockRejectedValueOnce(axiosError)

    await expect(
        bemService.update(1, {})
    ).rejects.toThrow('Erro ao atualizar bem')
    })

    // ===============================
    // ERRO EM APROVAR
    // ===============================

    it('deve lançar erro ao falhar aprovar', async () => {
    const axiosError = new AxiosError(
        'Erro qualquer',
        '500',
        undefined,
        undefined,
        {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
        } as any
    )

    vi.spyOn(api, 'post').mockRejectedValueOnce(axiosError)

    await expect(
        bemService.aprovar([1])
    ).rejects.toThrow('Erro ao aprovar bens')
    })

    // ===============================
    // ERRO EM REPROVAR
    // ===============================

    it('deve lançar erro ao falhar reprovar', async () => {
    const axiosError = new AxiosError(
        'Erro qualquer',
        '500',
        undefined,
        undefined,
        {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
        } as any
    )

    vi.spyOn(api, 'post').mockRejectedValueOnce(axiosError)

    await expect(
        bemService.reprovar([1])
    ).rejects.toThrow('Erro ao reprovar bens')
    })
})