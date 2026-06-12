import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MovimentacoesListPage from './MovimentacoesListPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('MovimentacoesListPage', () => {
  const renderComponent = () =>
    render(
      <MemoryRouter>
        <MovimentacoesListPage />
      </MemoryRouter>,
    )

  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('deve renderizar o título da página', () => {
    renderComponent()
    expect(
      screen.getByRole('heading', { name: /movimenta/i }),
    ).toBeInTheDocument()
  })

  it('deve renderizar o breadcrumb', () => {
    renderComponent()
    expect(screen.getByText(/in/i)).toBeInTheDocument()
    expect(screen.getByText('Bem Patrimonial')).toBeInTheDocument()
    expect(screen.getAllByText(/movimenta/i).length).toBeGreaterThanOrEqual(1)
  })

  it('deve exibir o botão para adicionar movimentação', () => {
    renderComponent()
    expect(screen.getByRole('button', { name: /adicionar movimenta/i })).toBeInTheDocument()
  })

  it('deve navegar para a tela de cadastro ao clicar em adicionar', () => {
    renderComponent()
    fireEvent.click(screen.getByRole('button', { name: /adicionar movimenta/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes/novo')
  })

  it('deve navegar para trás ao clicar em voltar', () => {
    renderComponent()
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
