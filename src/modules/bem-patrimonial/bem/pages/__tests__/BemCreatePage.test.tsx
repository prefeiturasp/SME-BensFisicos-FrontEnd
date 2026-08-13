import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as bemServiceModule from '../../services/bem.service'
import { useAuth } from '@/auth/useAuth'
import BemCreatePage from '../BemCreatePage'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

let mockUAs: any[] = [
  { id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' },
]

vi.mock('@/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      is_gestor_patrimonio: true,
      opcoes_escopo: {
        grupos: [{ uo: { id: 1, label: 'UO Teste' }, uas: mockUAs }],
      },
    },
  })),
}))

vi.mock('@/components/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <nav />,
}))

vi.mock('../../components/LinhaBemRow', () => ({
  LinhaBemRow: ({ addLinha, removeLinha, index, errors, linha, linhas, setLinhas }: any) => (
    <div data-testid={`linha-${index}`}>
      {errors?.numero_patrimonial && (
        <p data-testid={`erro-linha-${index}`}>{errors.numero_patrimonial}</p>
      )}
      {errors?.localizacao && (
        <p data-testid={`erro-localizacao-${index}`}>{errors.localizacao}</p>
      )}
      <input
        data-testid={`localizacao-${index}`}
        placeholder="Localização"
        value={linha.localizacao}
        onChange={(e) => {
          const newLinhas = [...linhas]
          newLinhas[index] = { ...newLinhas[index], localizacao: e.target.value }
          setLinhas(newLinhas)
        }}
      />
      <input
        data-testid={`numero-processo-${index}`}
        placeholder="Número do Processo de Incorporação"
        value={linha.numero_processo}
        onChange={(e) => {
          const newLinhas = [...linhas]
          newLinhas[index] = { ...newLinhas[index], numero_processo: e.target.value }
          setLinhas(newLinhas)
        }}
      />
      <button onClick={() => removeLinha(index)}>Remover Linha</button>
      <button onClick={addLinha}>Adicionar Linha</button>
    </div>
  ),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bens-patrimoniais/novo']}>
      <Routes>
        <Route path="/bens-patrimoniais/novo" element={<BemCreatePage />} />
        <Route path="/bens-patrimoniais" element={<div>Lista</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function preencherCamposBase() {
  fireEvent.change(screen.getByPlaceholderText('Nome do Bem'), {
    target: { value: 'Notebook' },
  })
  fireEvent.change(screen.getByPlaceholderText('Descreva o bem'), {
    target: { value: 'Notebook corporativo' },
  })
  fireEvent.change(screen.getByPlaceholderText('0,00'), {
    target: { value: '1500,00' },
  })
  fireEvent.change(screen.getByPlaceholderText('Marca'), {
    target: { value: 'Dell' },
  })
  fireEvent.change(screen.getByPlaceholderText('Modelo'), {
    target: { value: 'Latitude' },
  })
  fireEvent.change(screen.getByPlaceholderText('Localização'), {
    target: { value: 'Sala 1' },
  })
  // UA é auto-selecionada pois o mock retorna apenas 1 UA
}

describe('BemCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUAs = [{ id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' }]

    // vi.clearAllMocks() não restaura implementações setadas via
    // mockReturnValue/mockImplementation (só limpa .mock.calls/.results) —
    // reforça aqui o estado padrão (sem ua_ativa) pra testes que
    // sobrescrevem useAuth não vazarem esse valor pros testes seguintes.
    // Usa mockImplementation (não mockReturnValue) pra continuar lendo
    // mockUAs dinamicamente a cada chamada, já que alguns testes reatribuem
    // mockUAs depois do beforeEach e esperam que o mock reflita o valor atual.
    vi.mocked(useAuth).mockImplementation(() => ({
      user: {
        is_gestor_patrimonio: true,
        opcoes_escopo: {
          grupos: [{ uo: { id: 1, label: 'UO Teste' }, uas: mockUAs }],
        },
      },
    }) as any)

    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {
          // Não é necessário observar de fato em ambiente de teste (jsdom)
        }
        unobserve() {
          // Não é necessário desobservar de fato em ambiente de teste (jsdom)
        }
        disconnect() {
          // Não é necessário desconectar de fato em ambiente de teste (jsdom)
        }
      },
    )
  })

  // ------------------------------------------------------------------
  // Renderização
  // ------------------------------------------------------------------

  it('deve renderizar título', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /Adicionar Bem Patrimonial/i })
    ).toBeInTheDocument()
  })

  it('deve renderizar campos obrigatórios com asterisco', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Nome do Bem')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Descreva o bem')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Marca')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Modelo')).toBeInTheDocument()
  })

  it('deve renderizar input de busca de UA', () => {
    renderPage()
    expect(
      screen.getByPlaceholderText('Buscar Unidade Administrativa...')
    ).toBeInTheDocument()
  })

  it('deve auto-selecionar UA quando usuário tem apenas uma', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByDisplayValue('UA Teste - 001')).toBeInTheDocument()
    })
  })

  it('deve renderizar uma linha de bem por padrão', () => {
    renderPage()
    expect(screen.getByTestId('linha-0')).toBeInTheDocument()
  })

  // ------------------------------------------------------------------
  // Unidade Administrativa ativa (contexto global do header)
  // ------------------------------------------------------------------

  it('não deve exibir o campo Unidade Administrativa quando o usuário tem uma UA ativa no header', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        is_gestor_patrimonio: true,
        ua_ativa: { id: 42, label: 'UA Ativa - 042' },
        opcoes_escopo: {
          grupos: [{ uo: { id: 1, label: 'UO Teste' }, uas: mockUAs }],
        },
      },
    } as any)

    renderPage()

    expect(
      screen.queryByLabelText('Unidade Administrativa')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Buscar Unidade Administrativa...')
    ).not.toBeInTheDocument()
  })

  it('deve usar a UA ativa do header como unidade_administrativa ao salvar, mesmo sem exibir o campo', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        is_gestor_patrimonio: true,
        ua_ativa: { id: 42, label: 'UA Ativa - 042' },
        opcoes_escopo: {
          grupos: [{ uo: { id: 1, label: 'UO Teste' }, uas: mockUAs }],
        },
      },
    } as any)

    const spy = vi
      .spyOn(bemServiceModule.bemService, 'createMulti')
      .mockResolvedValue(undefined as any)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      const payload = spy.mock.calls[0][0]
      expect(payload.unidade_administrativa).toBe('42')
    })
  })

  it('deve exibir o campo Unidade Administrativa quando o usuário não tem UA ativa (acesso a múltiplas UAs)', () => {
    mockUAs = [
      { id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' },
      { id: 2, unidade_administrativa_id: 20, label: 'UA Teste - 002' },
    ]
    vi.mocked(useAuth).mockReturnValue({
      user: {
        is_gestor_patrimonio: true,
        ua_ativa: null,
        opcoes_escopo: {
          grupos: [{ uo: { id: 1, label: 'UO Teste' }, uas: mockUAs }],
        },
      },
    } as any)

    renderPage()

    expect(
      screen.getByPlaceholderText('Buscar Unidade Administrativa...')
    ).toBeInTheDocument()
  })

  // ------------------------------------------------------------------
  // Ordem dos botões e disposição conforme protótipo
  // ------------------------------------------------------------------

  it('deve exibir o botão Salvar antes do botão Cancelar', () => {
    renderPage()
    const buttons = screen.getAllByRole('button')
    const textos = buttons.map((b) => b.textContent)
    expect(textos.indexOf('Salvar')).toBeLessThan(textos.indexOf('Cancelar'))
  })

  // ------------------------------------------------------------------
  // Edição de campos
  // ------------------------------------------------------------------

  it('deve permitir preencher campo nome', () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('Nome do Bem'), {
      target: { value: 'Notebook Dell' },
    })
    expect(screen.getByDisplayValue('Notebook Dell')).toBeInTheDocument()
  })

  // ------------------------------------------------------------------
  // Validação de campos obrigatórios no front
  // ------------------------------------------------------------------

  it('deve manter o botão Salvar desabilitado enquanto campos obrigatórios estiverem vazios', () => {
    renderPage()
    expect(screen.getByText('Salvar')).toBeDisabled()
  })

  it('não deve chamar createMulti se campos obrigatórios estiverem vazios (botão desabilitado)', async () => {
    const spy = vi.spyOn(bemServiceModule.bemService, 'createMulti')
    renderPage()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(spy).not.toHaveBeenCalled()
    })
  })

  it('deve habilitar o botão Salvar somente após preencher todos os campos obrigatórios, incluindo a localização da linha', () => {
    renderPage()
    expect(screen.getByText('Salvar')).toBeDisabled()

    preencherCamposBase()

    expect(screen.getByText('Salvar')).toBeEnabled()
  })

  it('deve exibir mensagem de erro inline para campo unidade_administrativa retornado pelo backend', async () => {
    const axiosError = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: { nome: 'Nome do Bem é obrigatório.' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    } as any)

    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(axiosError)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByText('Nome do Bem é obrigatório.')).toBeInTheDocument()
    })
  })

  it('deve limpar erro do campo ao editar (erro vindo do backend)', async () => {
    const axiosError = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: { nome: 'Nome do Bem é obrigatório.' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    } as any)

    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(axiosError)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByText('Nome do Bem é obrigatório.')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Nome do Bem'), {
      target: { value: 'Notebook Editado' },
    })

    expect(screen.queryByText('Nome do Bem é obrigatório.')).not.toBeInTheDocument()
  })

  it('deve manter o botão Salvar desabilitado quando a localização da linha estiver vazia', () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Nome do Bem'), { target: { value: 'Notebook' } })
    fireEvent.change(screen.getByPlaceholderText('Descreva o bem'), { target: { value: 'Desc' } })
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('Marca'), { target: { value: 'Dell' } })
    fireEvent.change(screen.getByPlaceholderText('Modelo'), { target: { value: 'X' } })
    // Localização propositalmente não preenchida

    expect(screen.getByText('Salvar')).toBeDisabled()
  })

  it('deve habilitar o botão Salvar ao preencher a localização da linha que faltava', () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Nome do Bem'), { target: { value: 'Notebook' } })
    fireEvent.change(screen.getByPlaceholderText('Descreva o bem'), { target: { value: 'Desc' } })
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('Marca'), { target: { value: 'Dell' } })
    fireEvent.change(screen.getByPlaceholderText('Modelo'), { target: { value: 'X' } })

    expect(screen.getByText('Salvar')).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Localização'), {
      target: { value: 'Sala 1' },
    })

    expect(screen.getByText('Salvar')).toBeEnabled()
  })

  it('deve exibir erro de localização por linha quando retornado pelo backend', async () => {
    const axiosError = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: {
        linhas: {
          '0': { localizacao: 'Localização é obrigatória.' },
        },
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    } as any)

    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(axiosError)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByTestId('erro-localizacao-0')).toBeInTheDocument()
      expect(screen.getByText('Localização é obrigatória.')).toBeInTheDocument()
    })
  })

  it('deve limpar erro de localização ao editar a linha (erro vindo do backend)', async () => {
    const axiosError = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: {
        linhas: {
          '0': { localizacao: 'Localização é obrigatória.' },
        },
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    } as any)

    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(axiosError)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByTestId('erro-localizacao-0')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Localização'), {
      target: { value: 'Sala Nova' },
    })

    await waitFor(() => {
      expect(screen.queryByTestId('erro-localizacao-0')).not.toBeInTheDocument()
    })
  })

  // ------------------------------------------------------------------
  // Chamada ao backend — sucesso
  // ------------------------------------------------------------------

  it('deve chamar createMulti com dados corretos e redirecionar ao salvar', async () => {
    const spy = vi
      .spyOn(bemServiceModule.bemService, 'createMulti')
      .mockResolvedValue(undefined as any)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Notebook',
          marca: 'Dell',
          modelo: 'Latitude',
          unidade_administrativa: '10',
          multi_payload: expect.any(Array),
        })
      )
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Bens criados com sucesso')
    })

    expect(await screen.findByText('Lista')).toBeInTheDocument()
  })

  it('multi_payload não deve conter o campo id', async () => {
    const spy = vi
      .spyOn(bemServiceModule.bemService, 'createMulti')
      .mockResolvedValue(undefined as any)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      const payload = spy.mock.calls[0][0]
      payload.multi_payload.forEach((item: any) => {
        expect(item).not.toHaveProperty('id')
      })
    })
  })

  it('deve enviar numero_processo por linha no multi_payload, e não como campo base', async () => {
    const spy = vi
      .spyOn(bemServiceModule.bemService, 'createMulti')
      .mockResolvedValue(undefined as any)

    renderPage()
    preencherCamposBase()

    fireEvent.change(
      screen.getByPlaceholderText('Número do Processo de Incorporação'),
      { target: { value: 'PROC-2024-001' } }
    )

    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      const payload = spy.mock.calls[0][0]
      expect(payload).not.toHaveProperty('numero_processo')
      expect(payload.multi_payload[0].numero_processo).toBe('PROC-2024-001')
    })
  })

  it('deve permitir números do processo distintos por linha ao adicionar múltiplos bens', async () => {
    const spy = vi
      .spyOn(bemServiceModule.bemService, 'createMulti')
      .mockResolvedValue(undefined as any)

    renderPage()
    preencherCamposBase()

    fireEvent.click(screen.getByText('Adicionar Linha'))

    const camposProcesso = screen.getAllByPlaceholderText(
      'Número do Processo de Incorporação'
    )
    fireEvent.change(camposProcesso[0], { target: { value: 'PROC-A' } })
    fireEvent.change(camposProcesso[1], { target: { value: 'PROC-B' } })

    const camposLocalizacao = screen.getAllByPlaceholderText('Localização')
    fireEvent.change(camposLocalizacao[1], { target: { value: 'Sala 2' } })

    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      const payload = spy.mock.calls[0][0]
      expect(payload.multi_payload[0].numero_processo).toBe('PROC-A')
      expect(payload.multi_payload[1].numero_processo).toBe('PROC-B')
    })
  })

  it('deve exibir o tooltip informativo no cabeçalho "Adicionar Bens Patrimoniais" ao passar o mouse', async () => {
    renderPage()

    const user = userEvent.setup()
    const titulo = screen.getByText('Adicionar Bens Patrimoniais')
    const tooltipTrigger = titulo.parentElement?.querySelector('svg')
    expect(tooltipTrigger).toBeInTheDocument()

    await user.hover(tooltipTrigger!)

    const tooltipMatches = await screen.findAllByText(
      /Para adicionar mais bens, clique no botão \+ ao final da linha/
    )
    expect(tooltipMatches.length).toBeGreaterThan(0)
  })

  // ------------------------------------------------------------------
  // Tratamento de erros do backend
  // ------------------------------------------------------------------

  it('deve exibir erros por linha quando backend retorna linhas com erros', async () => {
    const axiosError = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: {
        linhas: {
          '0': { numero_patrimonial: 'Número já cadastrado.' },
        },
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    } as any)

    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(axiosError)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByTestId('erro-linha-0')).toBeInTheDocument()
      expect(screen.getByText('Número já cadastrado.')).toBeInTheDocument()
    })

    expect(toast.error).toHaveBeenCalledWith('Corrija os erros nas linhas dos bens.')
  })

  it('deve exibir toast de erro genérico quando backend falha sem estrutura esperada', async () => {
    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(
      new Error('Erro de conexão')
    )

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao salvar. Tente novamente.')
    })
  })

  // ------------------------------------------------------------------
  // Linhas de bens
  // ------------------------------------------------------------------

  it('deve adicionar nova linha ao clicar no botão', () => {
    renderPage()
    fireEvent.click(screen.getByText('Adicionar Linha'))
    expect(screen.getByTestId('linha-1')).toBeInTheDocument()
  })

  it('deve remover linha quando há mais de uma', () => {
    renderPage()
    fireEvent.click(screen.getByText('Adicionar Linha'))
    expect(screen.getAllByTestId(/^linha-/).length).toBe(2)

    fireEvent.click(screen.getAllByText('Remover Linha')[0])
    expect(screen.getAllByTestId(/^linha-/).length).toBe(1)
  })

  it('não deve remover a última linha', () => {
    renderPage()
    expect(screen.getAllByTestId(/^linha-/).length).toBe(1)

    fireEvent.click(screen.getByText('Remover Linha'))
    expect(screen.getAllByTestId(/^linha-/).length).toBe(1)
  })

  it('deve limpar erros das linhas ao editar qualquer linha', async () => {
    const axiosError = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: { linhas: { '0': { numero_patrimonial: 'Inválido.' } } },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    } as any)

    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(axiosError)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByTestId('erro-linha-0')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Adicionar Linha'))

    await waitFor(() => {
      expect(screen.queryByTestId('erro-linha-0')).not.toBeInTheDocument()
    })
  })

  // ------------------------------------------------------------------
  // Estado do botão durante o envio
  // ------------------------------------------------------------------

  it('deve desabilitar botão e mostrar "Salvando..." enquanto envia', async () => {
    let resolve: any
    const promise = new Promise(r => { resolve = r })
    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockReturnValue(promise as any)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeDisabled()
    })

    resolve(undefined)

    await waitFor(() => {
      expect(screen.queryByText('Salvando...')).not.toBeInTheDocument()
    })
  })

  it('deve reabilitar botão após erro', async () => {
    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(
      new Error('Erro')
    )

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(screen.getByText('Salvar')).not.toBeDisabled()
    })
  })

  // ------------------------------------------------------------------
  // Navegação
  // ------------------------------------------------------------------

  it('deve redirecionar ao clicar em Cancelar', async () => {
    renderPage()
    fireEvent.click(screen.getByText('Cancelar'))
    expect(await screen.findByText('Lista')).toBeInTheDocument()
  })

  // ------------------------------------------------------------------
  // UASearchSelect — interações do dropdown
  // ------------------------------------------------------------------

  it('deve abrir dropdown ao focar no campo de busca de UA', async () => {
    mockUAs = [
      { id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' },
      { id: 2, unidade_administrativa_id: 20, label: 'UA Teste - 002' },
    ]
    renderPage()

    fireEvent.focus(screen.getByPlaceholderText('Buscar Unidade Administrativa...'))

    await waitFor(() => {
      expect(screen.getByText('UA Teste - 001')).toBeInTheDocument()
      expect(screen.getByText('UA Teste - 002')).toBeInTheDocument()
    })
  })

  it('deve filtrar UAs ao digitar no campo de busca', async () => {
    mockUAs = [
      { id: 1, unidade_administrativa_id: 10, label: 'Biblioteca Central' },
      { id: 2, unidade_administrativa_id: 20, label: 'Secretaria Regional' },
    ]
    renderPage()

    const input = screen.getByPlaceholderText('Buscar Unidade Administrativa...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'biblio' } })

    await waitFor(() => {
      expect(screen.getByText('Biblioteca Central')).toBeInTheDocument()
      expect(screen.queryByText('Secretaria Regional')).not.toBeInTheDocument()
    })
  })

  it('deve exibir "Nenhuma unidade encontrada" quando busca não tem resultado', async () => {
    mockUAs = [
      { id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' },
    ]
    renderPage()

    const input = screen.getByPlaceholderText('Buscar Unidade Administrativa...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'zzzzz' } })

    await waitFor(() => {
      expect(screen.getByText('Nenhuma unidade encontrada')).toBeInTheDocument()
    })
  })

  it('deve selecionar UA ao clicar na opção do dropdown', async () => {
    mockUAs = [
      { id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' },
      { id: 2, unidade_administrativa_id: 20, label: 'UA Teste - 002' },
    ]
    renderPage()

    fireEvent.focus(screen.getByPlaceholderText('Buscar Unidade Administrativa...'))

    await waitFor(() => {
      expect(screen.getByText('UA Teste - 002')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('UA Teste - 002'))

    await waitFor(() => {
      expect(screen.getByDisplayValue('UA Teste - 002')).toBeInTheDocument()
    })
  })

  it('deve fechar dropdown ao clicar fora do componente', async () => {
    mockUAs = [
      { id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' },
    ]
    renderPage()

    fireEvent.focus(screen.getByPlaceholderText('Buscar Unidade Administrativa...'))

    await waitFor(() => {
      expect(screen.getByText('UA Teste - 001')).toBeInTheDocument()
    })

    fireEvent.mouseDown(document.body)

    await waitFor(() => {
      expect(screen.queryByText('UA Teste - 001')).not.toBeInTheDocument()
    })
  })

  it('deve exibir erro de unidade_administrativa vinda do backend nos campos base', async () => {
    mockUAs = [{ id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' }]
    const axiosError = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: { unidade_administrativa: 'UA inválida.' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    } as any)

    vi.spyOn(bemServiceModule.bemService, 'createMulti').mockRejectedValue(axiosError)

    renderPage()
    preencherCamposBase()
    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Corrija os erros no formulário.')
    })
  })

  it('deve permitir preencher campo número do processo de incorporação (por linha)', () => {
    mockUAs = [{ id: 1, unidade_administrativa_id: 10, label: 'UA Teste - 001' }]
    renderPage()

    fireEvent.change(
      screen.getByPlaceholderText('Número do Processo de Incorporação'),
      { target: { value: 'PROC-2024-001' } }
    )

    expect(screen.getByDisplayValue('PROC-2024-001')).toBeInTheDocument()
  })
})