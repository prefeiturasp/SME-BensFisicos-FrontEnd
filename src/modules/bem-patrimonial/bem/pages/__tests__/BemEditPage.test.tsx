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

  it('deve mostrar loader inicialmente', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

      ; (useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('deve carregar dados no formulário', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true },
      })

    renderPage()

    expect(await screen.findByDisplayValue('Notebook Dell')).toBeInTheDocument()

    expect(screen.getByDisplayValue('Sala 1')).toBeInTheDocument()

    expect(screen.getByText('Status: Ativo')).toBeInTheDocument()
  })

  it('deve salvar com sucesso', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

    vi.spyOn(bemServiceModule.bemService, 'update').mockResolvedValue({
      ...bemMock,
    } as any)

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true },
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

  it('deve mostrar erro ao salvar sem response.data', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

    vi.spyOn(bemServiceModule.bemService, 'update').mockRejectedValue(
      new Error('Erro customizado')
    )

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true },
      })

    renderPage()

    fireEvent.click(await screen.findByText('Salvar Edição'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao salvar')
    })
  })

  it('deve setar erro de validação no campo', async () => {
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

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true },
      })

    renderPage()

    fireEvent.click(await screen.findByText('Salvar Edição'))

    expect(await screen.findByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('deve redirecionar para lista se falhar ao carregar', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockRejectedValue(
      new Error('Erro')
    )

      ; (useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    expect(await screen.findByText('Lista')).toBeInTheDocument()

    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar bem')
  })

  it('não deve permitir edição se não for gestor', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: false },
      })

    renderPage()

    const input = await screen.findByDisplayValue('Notebook Dell')

    expect(input).toBeDisabled()
  })

  it('deve navegar para detail ao clicar em Voltar', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

      ; (useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    fireEvent.click(await screen.findByText('Voltar'))

    expect(await screen.findByText('Detail Page')).toBeInTheDocument()
  })

  it('deve exigir justificativa ao alterar somente nome', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

    vi.spyOn(bemServiceModule.bemService, 'update').mockResolvedValue({
      ...bemMock,
    } as any)

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true },
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

  it('deve validar formato inválido do número patrimonial antes da justificativa', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve').mockResolvedValue(
      bemMock as any
    )

    const updateSpy = vi
      .spyOn(bemServiceModule.bemService, 'update')
      .mockResolvedValue({ ...bemMock } as any)

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true },
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

      ; (useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true },
      })

    renderPage()

    const numeroInput = await screen.findByDisplayValue('123')

    fireEvent.change(numeroInput, {
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
})