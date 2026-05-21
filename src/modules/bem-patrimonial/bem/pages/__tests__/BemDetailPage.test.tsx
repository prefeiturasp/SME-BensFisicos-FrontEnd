import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as bemServiceModule from '../../services/bem.service'
import BemDetailPage from '../BemDetailPage'
import { useAuth } from '@/auth/useAuth'
import { toast } from 'sonner'

vi.mock('@/auth/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock(
  '@/modules/bem-patrimonial/bem/modals/HistoricoModal',
  () => ({
    default: ({ open }: any) =>
      open ? (
        <div data-testid="modal-historico">
          Modal Histórico
        </div>
      ) : null,
  })
)

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
  unidade_orcamentaria_nome: 'UO Central',
  criado_por_nome: 'Admin',
  criado_em: '2024-01-01',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bens-patrimoniais/1']}>
      <Routes>
        <Route
          path="/bens-patrimoniais/:id"
          element={<BemDetailPage />}
        />
        <Route
          path="/bens-patrimoniais/:id/editar"
          element={<div>Editar Page</div>}
        />
        <Route
          path="/bens-patrimoniais"
          element={<div>Lista</div>}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('BemDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve mostrar loader inicialmente', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
      .mockResolvedValue(bemMock as any)

    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    expect(
        document.querySelector('.animate-spin')
    ).toBeInTheDocument()
  })

  it('deve carregar e exibir dados do bem', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
      .mockResolvedValue(bemMock as any)

    ;(useAuth as any).mockReturnValue({
      user: {
        is_gestor_patrimonio: true,
        ua_ativa: { codigo: '001' },
      },
    })

    renderPage()

    expect(
      await screen.findByDisplayValue('Notebook Dell')
    ).toBeInTheDocument()

    expect(
      screen.getByDisplayValue('Sala 1')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Status: Ativo')
    ).toBeInTheDocument()
  })

  it('deve exibir botão Editar quando gestor e não baixa física', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
      .mockResolvedValue(bemMock as any)

    ;(useAuth as any).mockReturnValue({
      user: {
        is_gestor_patrimonio: true,
        ua_ativa: { codigo: '001' },
      },
    })

    renderPage()

    expect(
      await screen.findByText('Editar')
    ).toBeInTheDocument()
  })

  it('não deve exibir botão Editar se não for gestor', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
      .mockResolvedValue(bemMock as any)

    ;(useAuth as any).mockReturnValue({
      user: { is_gestor_patrimonio: false },
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')

    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
  })

  it('deve abrir modal de histórico ao clicar no botão', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
      .mockResolvedValue(bemMock as any)

    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')

    fireEvent.click(screen.getByText('Histórico'))

    expect(
      await screen.findByTestId('modal-historico')
    ).toBeInTheDocument()
  })

  it('deve redirecionar e mostrar toast se houver erro', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
      .mockRejectedValue(new Error('Erro'))

    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    expect(
      await screen.findByText('Lista')
    ).toBeInTheDocument()

    expect(toast.error).toHaveBeenCalledWith(
      'Erro ao carregar bem'
    )
  })

  it('deve renderizar null quando bem for null após loading', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
        .mockResolvedValue(null as any)

    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    // espera loader sumir
    await screen.findByTestId('loader')

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(
        screen.queryByText('Visualizar Cadastro do Bem Patrimonial')
    ).not.toBeInTheDocument()
  })

  it('não deve exibir botão Editar se status for baixa_fisica mesmo sendo gestor', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
        .mockResolvedValue({
        ...bemMock,
        status: 'baixa_fisica',
        } as any)

    ;(useAuth as any).mockReturnValue({
        user: { is_gestor_patrimonio: true, ua_ativa: { codigo: '001' } },
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')

    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
   })


   it('não deve exibir Editar se user for undefined', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
        .mockResolvedValue(bemMock as any)

    ;(useAuth as any).mockReturnValue({
        user: undefined,
    })

    renderPage()

    await screen.findByDisplayValue('Notebook Dell')

    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled()
   })
   
   it('deve navegar para edição ao clicar em Editar', async () => {
        vi.spyOn(bemServiceModule.bemService, 'retrieve')
            .mockResolvedValue(bemMock as any)

        ;(useAuth as any).mockReturnValue({
            user: {
              is_gestor_patrimonio: true,
              ua_ativa: { codigo: '001' },
            },
        })

        renderPage()

        fireEvent.click(await screen.findByText('Editar'))

        expect(
            await screen.findByText('Editar Page')
        ).toBeInTheDocument()
   })

   it('deve navegar para lista ao clicar em Voltar', async () => {
    vi.spyOn(bemServiceModule.bemService, 'retrieve')
        .mockResolvedValue(bemMock as any)

    ;(useAuth as any).mockReturnValue({ user: {} })

    renderPage()

    fireEvent.click(await screen.findByText('Voltar'))

    expect(
        await screen.findByText('Lista')
    ).toBeInTheDocument()
  })

})
