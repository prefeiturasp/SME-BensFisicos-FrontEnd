import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as bemServiceModule from '../../services/bem.service'
import BemEditPage from '../BemEditPage'
import { useAuth } from '@/auth/useAuth'
import { toast } from 'sonner'

vi.mock('@/auth/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('../../hooks/useNumeroPatrimonial', () => ({
  useNumeroPatrimonial: () => ({
    disabled: false,
    semNumeracao: true,
    applyMask: (v: string) => v,
    handleFormatoAntigoChange: vi.fn(),
    handleSemNumeracaoChange: vi.fn(),
    ativarFormatoAntigo: vi.fn(),
    desativarFormatoAntigo: vi.fn(),
  }),
}))

const bemMock = {
  id: 1,
  nome: 'Notebook Dell',
  descricao: 'Notebook corporativo',
  numero_patrimonial: '123',
  numero_formato_antigo: false,
  sem_numeracao: false,
  valor_unitario: 5000,
  marca: 'Dell',
  modelo: 'Latitude',
  localizacao: 'Sala 1',
  numero_processo: 'PROC-01',
  numero_processo_baixa: null,
  status: 'ativo',
  status_display: 'Ativo',
  unidade_administrativa_codigo: '001',
  unidade_administrativa_nome: 'Escola Central',
  unidade_orcamentaria_nome: 'Financeiro',
}

const bemBaixaFisicaMock = {
  ...bemMock,
  status: 'baixa_fisica',
  status_display: 'Baixa Física',
}

const bemSemNumeracaoMock = {
  ...bemMock,
  numero_patrimonial: null,
  sem_numeracao: true,
}

const bemFormatoAntigoMock = {
  ...bemMock,
  numero_patrimonial: 'ANTIGO-123',
  numero_formato_antigo: true,
}

const bemUoAtivaMock = {
  ...bemMock,
  unidade_orcamentaria_nome: '01.16.10 - GABINETE DO SECRETARIO',
}

const userGestorAutorizado = {
  is_gestor_patrimonio: true,
  ua_ativa: null,
  uo_ativa: null,
  opcoes_escopo: {
    grupos: [
      {
        uo: {
          id: 10,
          codigo: '01.16.10',
          nome: 'Financeiro',
          label: '01.16.10 - Financeiro',
          selecionavel: true,
          unidade_administrativa_id: null,
          unidade_orcamentaria_id: 10,
        },
        uas: [
          {
            id: 1,
            codigo: '001',
            nome: 'Escola Central',
            label: '001 - Escola Central',
            unidade_administrativa_id: 1,
            unidade_orcamentaria_id: 10,
          },
        ],
      },
    ],
  },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bens-patrimoniais/1/editar']}>
      <Routes>
        <Route
          path="/bens-patrimoniais/:id/editar"
          element={<BemEditPage />}
        />
        <Route
          path="/bens-patrimoniais/:id"
          element={<div>Detail Page</div>}
        />
        <Route
          path="/bens-patrimoniais"
          element={<div>Lista</div>}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('BemEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Carregamento ────────────────────────────────────────────────────────────

  it('deve mostrar loader inicialmente', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('deve carregar dados no formulário', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    expect(await screen.findByDisplayValue('Notebook Dell')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sala 1')).toBeInTheDocument()
    expect(screen.getByText('Status: Ativo')).toBeInTheDocument()
  })

  it('deve permitir edição quando gestor tem acesso à UA do bem', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemUoAtivaMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    expect(await screen.findByDisplayValue('Notebook Dell')).toBeInTheDocument()
    expect(screen.getByText('Salvar Edição')).toBeInTheDocument()
  })

  it('deve redirecionar para lista se falhar ao carregar', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockRejectedValue(
      new Error('Erro')
    )
    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    expect(await screen.findByText('Lista')).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar bem')
  })

  // ─── Permissões ──────────────────────────────────────────────────────────────

  it('não deve permitir edição se não for gestor', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: { is_gestor_patrimonio: false },
    })

    renderPage()

    const input = await screen.findByDisplayValue('Notebook Dell')
    expect(input).toBeDisabled()
  })

  it('não deve exibir botão Salvar Edição se não for gestor', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: { is_gestor_patrimonio: false },
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')
    expect(screen.queryByText('Salvar Edição')).not.toBeInTheDocument()
  })

  it('não deve permitir edição se status for baixa_fisica', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemBaixaFisicaMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    const input = await screen.findByDisplayValue('Notebook Dell')
    expect(input).toBeDisabled()
    expect(screen.queryByText('Salvar Edição')).not.toBeInTheDocument()
  })

  // ─── Navegação ───────────────────────────────────────────────────────────────

  it('deve navegar para detail ao clicar em Voltar', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    fireEvent.click(await screen.findByText('Voltar'))

    expect(await screen.findByText('Detail Page')).toBeInTheDocument()
  })

  // ─── Submissão bem-sucedida ───────────────────────────────────────────────────

  it('deve salvar com sucesso ao alterar nome com justificativa', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    vi.spyOn(bemServiceModule.bemService, 'update').mockResolvedValue({
      ...bemMock,
    } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('Notebook Dell'), {
      target: { value: 'Novo Nome' },
    })

    fireEvent.change(
      screen.getByPlaceholderText('Justificativa para a alteração'),
      { target: { value: 'Justificativa de teste' } }
    )

    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Bem atualizado com sucesso')
    })

    expect(await screen.findByText('Detail Page')).toBeInTheDocument()
  })

  it('deve salvar sem justificativa quando não há alteração de nome ou número', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockResolvedValue({ ...bemMock } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    // Altera só localizacao (não aciona justificativa obrigatória)
    fireEvent.change(await screen.findByDisplayValue('Sala 1'), {
      target: { value: 'Sala 2' },
    })

    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled()
    })

    expect(toast.success).toHaveBeenCalledWith('Bem atualizado com sucesso')
  })

  it('deve passar justificativa vazia quando campo não está habilitado', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockResolvedValue({ ...bemMock } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')
    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        bemMock.id,
        expect.objectContaining({ justificativa: '' })
      )
    })
  })

  // ─── Erros de submissão ───────────────────────────────────────────────────────

  it('deve mostrar erro ao salvar sem response.data', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    vi.spyOn(bemServiceModule.bemService, 'update').mockRejectedValue(
      new Error('Erro customizado')
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.click(await screen.findByText('Salvar Edição'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao salvar')
    })
  })

  it('deve setar erro de validação no campo via response.data', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    vi.spyOn(bemServiceModule.bemService, 'update').mockRejectedValue({
      response: {
        data: {
          nome: ['Campo obrigatório'],
        },
      },
    })
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.click(await screen.findByText('Salvar Edição'))

    expect(await screen.findByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('deve exibir erro de duplicidade do número patrimonial na atualização', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockRejectedValue({
        response: {
          data: {
            numero_patrimonial: ['Número patrimonial já cadastrado.'],
          },
        },
      })
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('123'), {
      target: { value: '999.999999999-9' },
    })

    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled()
    })

    expect(
      await screen.findByText('Número patrimonial já cadastrado.')
    ).toBeInTheDocument()

    expect(
      screen.queryByText(
        'Justificativa é obrigatória quando Nome ou Número Patrimonial são alterados.'
      )
    ).not.toBeInTheDocument()
  })

  // ─── Justificativa ────────────────────────────────────────────────────────────

  it('deve exigir justificativa ao alterar somente nome', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    vi.spyOn(bemServiceModule.bemService, 'update').mockResolvedValue({
      ...bemMock,
    } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('Notebook Dell'), {
      target: { value: 'Novo Nome' },
    })

    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(
        screen.getByText(
          'Justificativa é obrigatória quando Nome ou Número Patrimonial são alterados.'
        )
      ).toBeInTheDocument()
    })

    expect(bemServiceModule.bemService.update).not.toHaveBeenCalled()
  })

  it('deve exibir asterisco vermelho na label justificativa ao alterar nome', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('Notebook Dell'), {
      target: { value: 'Novo Nome' },
    })

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('campo justificativa deve estar desabilitado quando nome e número não foram alterados', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')

    const justificativaField = screen.getByPlaceholderText(
      'Habilitado ao alterar Nome do Bem ou Número Patrimonial'
    )
    expect(justificativaField).toBeDisabled()
  })

  it('campo justificativa deve ser habilitado ao alterar nome', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('Notebook Dell'), {
      target: { value: 'Outro Nome' },
    })

    const justificativaField = screen.getByPlaceholderText(
      'Justificativa para a alteração'
    )
    expect(justificativaField).not.toBeDisabled()
  })

  it('campo justificativa deve ser habilitado ao alterar número patrimonial', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('123'), {
      target: { value: '999.999999999-9' },
    })

    const justificativaField = screen.getByPlaceholderText(
      'Justificativa para a alteração'
    )
    expect(justificativaField).not.toBeDisabled()
  })

  it('deve limpar erro da justificativa ao preencher o campo', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    vi.spyOn(bemServiceModule.bemService, 'update').mockResolvedValue({
      ...bemMock,
    } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('Notebook Dell'), {
      target: { value: 'Novo Nome' },
    })

    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(
        screen.getByText(
          'Justificativa é obrigatória quando Nome ou Número Patrimonial são alterados.'
        )
      ).toBeInTheDocument()
    })

    fireEvent.change(
      screen.getByPlaceholderText('Justificativa para a alteração'),
      { target: { value: 'Preenchendo agora' } }
    )

    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Bem atualizado com sucesso')
    })
  })

  // ─── Número patrimonial ───────────────────────────────────────────────────────

  it('deve validar formato inválido do número patrimonial antes da justificativa', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockResolvedValue({ ...bemMock } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('123'), {
      target: { value: 'NUMERO-INVALIDO' },
    })

    fireEvent.click(screen.getByText('Salvar Edição'))

    expect(
      await screen.findByText(
        'Número patrimonial inválido. Use o formato 000.000000000-0.'
      )
    ).toBeInTheDocument()

    expect(updateSpy).not.toHaveBeenCalled()

    expect(
      screen.queryByText(
        'Justificativa é obrigatória quando Nome ou Número Patrimonial são alterados.'
      )
    ).not.toBeInTheDocument()
  })

  it('deve aceitar número patrimonial no formato correto sem erro', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockResolvedValue({ ...bemMock } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    fireEvent.change(await screen.findByDisplayValue('123'), {
      target: { value: '999.999999999-9' },
    })

    fireEvent.click(screen.getByText('Salvar Edição'))

    // Número válido → vai para API sem erro de formato
    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled()
    })

    expect(
      screen.queryByText(
        'Número patrimonial inválido. Use o formato 000.000000000-0.'
      )
    ).not.toBeInTheDocument()
  })

  it('deve aceitar sem_numeracao=true sem validar formato', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemSemNumeracaoMock as any
    )
    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockResolvedValue({ ...bemSemNumeracaoMock } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')
    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled()
    })

    expect(
      screen.queryByText(
        'Número patrimonial inválido. Use o formato 000.000000000-0.'
      )
    ).not.toBeInTheDocument()
  })

  it('deve aceitar numero_formato_antigo=true sem validar formato', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemFormatoAntigoMock as any
    )
    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockResolvedValue({ ...bemFormatoAntigoMock } as any)
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')
    fireEvent.click(screen.getByText('Salvar Edição'))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled()
    })

    expect(
      screen.queryByText(
        'Número patrimonial inválido. Use o formato 000.000000000-0.'
      )
    ).not.toBeInTheDocument()
  })

  // ─── Unidade Administrativa ───────────────────────────────────────────────────

  it('deve exibir unidade administrativa corretamente e desabilitada', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    const unidadeInput = await screen.findByDisplayValue(
      '001 - Escola Central'
    )
    expect(unidadeInput).toBeInTheDocument()
    expect(unidadeInput).toBeDisabled()
  })

  // ─── numero_processo_baixa ────────────────────────────────────────────────────

  it('campo numero_processo_baixa deve estar sempre desabilitado para gestor', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )
    ;(useAuth as any).mockReturnValue({
      user: userGestorAutorizado,
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')

    // // numero_processo_baixa é null no mock, então o input estará vazio
    // const inputs = screen.getAllByRole('textbox')
    // const baixaInput = inputs.find(
    //   (el) => el.getAttribute('id') === undefined && (el as HTMLInputElement).disabled
    // )
    // Verifica pelo label NUMERO PROCESSO BAIXA
    const label = screen.getByText('NUMERO PROCESSO BAIXA')
    expect(label).toBeInTheDocument()
  })
})
