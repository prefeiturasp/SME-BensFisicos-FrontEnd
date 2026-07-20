import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/api/http'
import { transferenciaService } from '../transferencia.service'

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

describe('transferenciaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve listar transferências com os parâmetros corretos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    })

    await transferenciaService.list({
      page: 2,
      pageSize: 30,
      search: 'Notebook',
      numero_ntbpm: 'NTBPM-1',
      numero_processo: '12345',
      unidade_orcamentaria_origem: 10,
      unidade_orcamentaria_destino: 20,
      ordering: '-criado_em',
    })

    const [url] = vi.mocked(api.get).mock.calls[0]
    expect(url).toContain('/transferencias/?')
    expect(url).toContain('page=2')
    expect(url).toContain('page_size=30')
    expect(url).toContain('search=Notebook')
    expect(url).toContain('numero_ntbpm=NTBPM-1')
    expect(url).toContain('numero_processo=12345')
    expect(url).toContain('unidade_orcamentaria_origem=10')
    expect(url).toContain('unidade_orcamentaria_destino=20')
    expect(url).toContain('ordering=-criado_em')
  })

  it('deve ignorar filtros vazios na listagem', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    })

    await transferenciaService.list({
      page: 0,
      pageSize: 0,
      search: '   ',
      numero_ntbpm: '   ',
      numero_processo: '   ',
      ordering: '',
    })

    const [url] = vi.mocked(api.get).mock.calls[0]
    expect(url).toBe('/transferencias/?')
  })

  it('deve criar transferência com o payload correto', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { id: 1, numero_ntbpm: '001.0000001.2026' },
    })

    const payload = {
      unidade_orcamentaria_destino: 20,
      numero_processo: '12345',
      observacao: 'Transferência interna',
      itens: [{ bem: 1 }, { bem: 2 }],
    }

    const result = await transferenciaService.create(payload)

    expect(result).toEqual({ id: 1, numero_ntbpm: '001.0000001.2026' })
    expect(api.post).toHaveBeenCalledWith('/transferencias/', payload)
  })

  it('deve buscar uma transferência pelo id', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { id: 9, numero_ntbpm: '001.0000009.2026' },
    })

    const result = await transferenciaService.retrieve(9)

    expect(api.get).toHaveBeenCalledWith('/transferencias/9/')
    expect(result).toEqual({ id: 9, numero_ntbpm: '001.0000009.2026' })
  })

  it('deve listar opções de cadastro de transferência', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 20,
          codigo: '99.01',
          nome: 'UO Destino',
          label: '99.01 - UO Destino',
          tem_ponto_central: true,
        },
      ],
    })

    const result = await transferenciaService.listOpcoesCadastro()

    expect(api.get).toHaveBeenCalledWith('/transferencias/opcoes-cadastro/')
    expect(result).toEqual([
      {
        id: 20,
        codigo: '99.01',
        nome: 'UO Destino',
        label: '99.01 - UO Destino',
        tem_ponto_central: true,
      },
    ])
  })

  it('deve baixar o documento NTBPM usando a url protegida recebida do backend', async () => {
    const blob = new Blob(['pdf-content'], { type: 'application/pdf' })

    vi.mocked(api.get).mockResolvedValue({
      data: blob,
    })

    const result = await transferenciaService.baixarDocumentoNtBpm(
      '/api/documento-ntbpm/9/download/',
    )

    expect(api.get).toHaveBeenCalledWith('/api/documento-ntbpm/9/download/', {
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })

  it('deve tratar erro ao criar transferência com detail da API', async () => {
    vi.mocked(api.post).mockRejectedValue(makeAxiosError(400, { detail: 'Falha ao criar' }))

    await expect(
      transferenciaService.create({
        unidade_orcamentaria_destino: 20,
        numero_processo: '12345',
        observacao: '',
        itens: [{ bem: 1 }],
      }),
    ).rejects.toThrow('Falha ao criar')
  })

  it('deve extrair a primeira mensagem de um array de erros ao listar', async () => {
    vi.mocked(api.get).mockRejectedValue(
      makeAxiosError(400, { numero_processo: ['Processo inválido'] }),
    )

    await expect(transferenciaService.list()).rejects.toThrow('Processo inválido')
  })

  it('deve tratar erro ao baixar o documento NTBPM', async () => {
    vi.mocked(api.get).mockRejectedValue(makeAxiosError(400, { detail: 'Falha ao baixar' }))

    await expect(
      transferenciaService.baixarDocumentoNtBpm('/api/documento-ntbpm/9/download/'),
    ).rejects.toThrow('Falha ao baixar')
  })

  it('deve lançar mensagem padrão ao carregar opções sem detail', async () => {
    vi.mocked(api.get).mockRejectedValue(makeAxiosError(500, {}))

    await expect(transferenciaService.listOpcoesCadastro()).rejects.toThrow(
      'Erro ao carregar opções de transferência',
    )
  })

  it('deve lançar erro de conexão quando não houver response', async () => {
    vi.mocked(api.get).mockRejectedValue(makeNetworkError())

    await expect(transferenciaService.retrieve(9)).rejects.toThrow(
      'Erro de conexão com o servidor.',
    )
  })

  it('deve relançar erro desconhecido', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Erro inesperado'))

    await expect(transferenciaService.list()).rejects.toThrow('Erro inesperado')
  })
})
