import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/api/http'
import { movimentacaoService } from '../movimentacao.service'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function makeAxiosError(status: number, data: unknown = {}) {
  const error = new AxiosError('error')
  error.response = {
    status,
    data,
    headers: {},
    config: {} as never,
    statusText: '',
  }
  return error
}

function makeNetworkError() {
  const error = new AxiosError('Network Error')
  error.response = undefined
  return error
}

describe('movimentacaoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve listar movimentações com os parâmetros corretos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    })

    await movimentacaoService.list({
      page: 2,
      pageSize: 30,
      search: 'Notebook',
      status: 'enviada',
      unidade_administrativa_origem: 10,
      unidade_administrativa_destino: 20,
      numero_cimbpm: 'CIMBPM-1',
      ordering: '-criado_em',
    })

    const [url] = vi.mocked(api.get).mock.calls[0]
    expect(url).toContain('/movimentacoes/?')
    expect(url).toContain('page=2')
    expect(url).toContain('page_size=30')
    expect(url).toContain('search=Notebook')
    expect(url).toContain('status=enviada')
    expect(url).toContain('unidade_administrativa_origem=10')
    expect(url).toContain('unidade_administrativa_destino=20')
    expect(url).toContain('numero_cimbpm=CIMBPM-1')
    expect(url).toContain('ordering=-criado_em')
  })

  it('deve enviar status múltiplos e filtro de atraso na listagem', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    })

    await movimentacaoService.list({
      status: ['enviada', 'aceita'],
      atrasada: 'true',
    })

    const [url] = vi.mocked(api.get).mock.calls[0]
    expect(url).toContain('status=enviada%2Caceita')
    expect(url).toContain('atrasada=true')
  })

  it('deve enviar o filtro de não atrasadas na listagem', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    })

    await movimentacaoService.list({
      atrasada: 'false',
    })

    const [url] = vi.mocked(api.get).mock.calls[0]
    expect(url).toContain('atrasada=false')
  })

  it('deve ignorar filtros vazios ou com valor todos na listagem', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    })

    await movimentacaoService.list({
      page: 0,
      pageSize: 0,
      search: '   ',
      status: ['todos', ''],
      unidade_administrativa_origem: 0,
      unidade_administrativa_destino: 0,
      numero_cimbpm: '   ',
      atrasada: 'todos',
      ordering: '',
    })

    const [url] = vi.mocked(api.get).mock.calls[0]
    expect(url).toBe('/movimentacoes/?')
  })

  it('deve criar movimentação com o payload correto', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { id: 1, status: 'enviada' },
    })

    const payload = {
      unidade_administrativa_origem: 10,
      unidade_orcamentaria_destino: 20,
      unidade_administrativa_destino: 30,
      observacao: 'Movimentação interna',
      itens: [{ bem: 1 }, { bem: 2 }],
    }

    const result = await movimentacaoService.create(payload)

    expect(result).toEqual({ id: 1, status: 'enviada' })
    expect(api.post).toHaveBeenCalledWith('/movimentacoes/', payload)
  })

  it('deve listar opções de cadastro de movimentação', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 20,
          codigo: '01.02',
          nome: 'UO Destino',
          label: '01.02 - UO Destino',
          tem_ponto_central: true,
        },
      ],
    })

    const result = await movimentacaoService.listOpcoesCadastro()

    expect(api.get).toHaveBeenCalledWith('/movimentacoes/opcoes-cadastro/')
    expect(result).toEqual([
      {
        id: 20,
        codigo: '01.02',
        nome: 'UO Destino',
        label: '01.02 - UO Destino',
        tem_ponto_central: true,
      },
    ])
  })

  it('deve buscar uma movimentação pelo id', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { id: 9, status: 'enviada' },
    })

    const result = await movimentacaoService.retrieve(9)

    expect(api.get).toHaveBeenCalledWith('/movimentacoes/9/')
    expect(result).toEqual({ id: 9, status: 'enviada' })
  })

  it('deve tratar erro ao listar opções de cadastro', async () => {
    vi.mocked(api.get).mockRejectedValue(
      makeAxiosError(400, { detail: 'Falha ao carregar opções' }),
    )

    await expect(movimentacaoService.listOpcoesCadastro()).rejects.toThrow(
      'Falha ao carregar opções',
    )
  })

  it('deve tratar erro ao buscar uma movimentação pelo id', async () => {
    vi.mocked(api.get).mockRejectedValue(makeNetworkError())

    await expect(movimentacaoService.retrieve(9)).rejects.toThrow(
      'Erro de conexão com o servidor.',
    )
  })

  it('deve lançar mensagem de detalhe da API ao falhar create', async () => {
    vi.mocked(api.post).mockRejectedValue(makeAxiosError(400, { detail: 'Erro customizado' }))

    await expect(
      movimentacaoService.create({
        unidade_administrativa_origem: 10,
        unidade_orcamentaria_destino: 20,
        unidade_administrativa_destino: 30,
        observacao: '',
        itens: [{ bem: 1 }],
      }),
    ).rejects.toThrow('Erro customizado')
  })

  it('deve extrair a primeira mensagem de um array de erros ao criar', async () => {
    vi.mocked(api.post).mockRejectedValue(
      makeAxiosError(400, { itens: ['Selecione ao menos um bem'] }),
    )

    await expect(
      movimentacaoService.create({
        unidade_administrativa_origem: 10,
        unidade_orcamentaria_destino: 20,
        unidade_administrativa_destino: 30,
        observacao: '',
        itens: [{ bem: 1 }],
      }),
    ).rejects.toThrow('Selecione ao menos um bem')
  })

  it('deve lançar mensagem padrão em erro sem detail ao criar', async () => {
    vi.mocked(api.post).mockRejectedValue(makeAxiosError(500, {}))

    await expect(
      movimentacaoService.create({
        unidade_administrativa_origem: 10,
        unidade_orcamentaria_destino: 20,
        unidade_administrativa_destino: 30,
        observacao: '',
        itens: [{ bem: 1 }],
      }),
    ).rejects.toThrow('Erro ao criar movimentação')
  })

  it('deve lançar erro de conexão quando não houver response', async () => {
    vi.mocked(api.get).mockRejectedValue(makeNetworkError())

    await expect(movimentacaoService.list()).rejects.toThrow(
      'Erro de conexão com o servidor.',
    )
  })

  it('deve extrair a primeira mensagem de um array de erros ao listar', async () => {
    vi.mocked(api.get).mockRejectedValue(makeAxiosError(400, { detail: ['Falha ao listar'] }))

    await expect(movimentacaoService.list()).rejects.toThrow('Falha ao listar')
  })

  it('deve usar a primeira mensagem disponível em objetos de erro ao listar', async () => {
    vi.mocked(api.get).mockRejectedValue(
      makeAxiosError(400, { itens: ['Mensagem aninhada'], other: ['Outra'] }),
    )

    await expect(movimentacaoService.list()).rejects.toThrow('Mensagem aninhada')
  })
})
