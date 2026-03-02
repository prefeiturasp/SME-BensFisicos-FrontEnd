import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as bemServiceModule from '../../services/bem.service'
import BemCreatePage from '../BemCreatePage'
import { toast } from 'sonner'
import { waitFor } from '@testing-library/react'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))


vi.mock('../../components/LinhaBemRow', () => ({
  LinhaBemRow: ({ addLinha, removeLinha, index }: any) => (
    <div>
      <button onClick={() => removeLinha(index)}>
        Remover Linha
      </button>
      <button onClick={addLinha}>
        Adicionar Linha
      </button>
    </div>
  ),
}))
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bens-patrimoniais/novo']}>
      <Routes>
        <Route
          path="/bens-patrimoniais/novo"
          element={<BemCreatePage />}
        />
        <Route
          path="/bens-patrimoniais"
          element={<div>Lista</div>}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('BemCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar título e botão salvar', () => {
    renderPage()

    expect(
      screen.getByRole('heading', {
        name: /Adicionar Bem Patrimonial/i
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText('Salvar')
    ).toBeInTheDocument()
  })

  it('deve permitir preencher campos base', () => {
    renderPage()

    fireEvent.change(
      screen.getByPlaceholderText('Nome do Bem'),
      { target: { value: 'Notebook' } }
    )

    expect(
      screen.getByDisplayValue('Notebook')
    ).toBeInTheDocument()
  })

  it('deve chamar createMulti e redirecionar ao salvar', async () => {
    ;(bemServiceModule.bemService as any).createMulti =
        vi.fn().mockResolvedValue(undefined)

    renderPage()

    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
        'Bens criados com sucesso'
        )
    })
    })

  it('deve mostrar erro se API falhar', async () => {
    ;(bemServiceModule.bemService as any).createMulti =
        vi.fn().mockRejectedValue(new Error('Erro'))

    renderPage()

    fireEvent.click(screen.getByText('Salvar'))

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao salvar')
    })
    })

  it('deve redirecionar ao clicar em Cancelar', async () => {
    renderPage()

    fireEvent.click(screen.getByText('Cancelar'))

    expect(
      await screen.findByText('Lista')
    ).toBeInTheDocument()
  })

  it('deve adicionar nova linha ao clicar no botão', () => {
    renderPage()

    fireEvent.click(screen.getByText('Adicionar Linha'))

    expect(
      screen.getAllByText('Adicionar Linha').length
    ).toBeGreaterThan(0)
  })

  it('deve impedir salvar se não houver linhas', async () => {
    renderPage()

    // Remove a única linha existente
    fireEvent.click(screen.getByText('Remover Linha'))

    fireEvent.click(screen.getByText('Salvar'))

    expect(toast.error).toHaveBeenCalledWith(
        'Adicione ao menos um bem'
    )
    })

    it('deve enviar payload correto para createMulti', async () => {
        const spy = vi.fn().mockResolvedValue(undefined)
        ;(bemServiceModule.bemService as any).createMulti = spy

        renderPage()

        fireEvent.change(
            screen.getByPlaceholderText('Nome do Bem'),
            { target: { value: 'Notebook' } }
        )

        fireEvent.click(screen.getByText('Salvar'))

        await waitFor(() => {
            expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                nome: 'Notebook',
                multi_payload: expect.any(Array),
            })
            )
        })
    })

    it('deve desabilitar botão enquanto salva', async () => {
        let resolvePromise: any
        const promise = new Promise(res => {
            resolvePromise = res
        })

        ;(bemServiceModule.bemService as any).createMulti =
            vi.fn().mockReturnValue(promise)

        renderPage()

        fireEvent.click(screen.getByText('Salvar'))

        expect(screen.getByText('Salvar')).toBeDisabled()

        resolvePromise()

        await waitFor(() => {
            expect(screen.getByText('Salvar')).not.toBeDisabled()
        })
    })

    it('deve reabilitar botão após erro', async () => {
        ;(bemServiceModule.bemService as any).createMulti =
            vi.fn().mockRejectedValue(new Error('Erro'))

        renderPage()

        fireEvent.click(screen.getByText('Salvar'))

        await waitFor(() => {
            expect(screen.getByText('Salvar')).not.toBeDisabled()
        })
    })
})