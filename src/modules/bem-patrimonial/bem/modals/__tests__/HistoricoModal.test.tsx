import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HistoricoModal from '../HistoricoModal'
import { bemService } from '../../services/bem.service'

vi.mock('../../services/bem.service', () => ({
  bemService: {
    getHistorico: vi.fn(),
  },
}))

const historicoMock = [
  {
    alterado_em: '2024-01-01T10:00:00',
    alterado_por: 1,
    alterado_por_nome: 'João Silva',
    acoes: [
      {
        campo: 'nome',
        valor_antigo: 'Mesa',
        valor_novo: 'Mesa Nova',
      },
    ],
  },
]

describe('HistoricoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não deve renderizar quando open for false', () => {
    render(
      <HistoricoModal
        open={false}
        bemId={1}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Histórico')).not.toBeInTheDocument()
  })

  it('deve carregar histórico quando aberto', async () => {
    ;(bemService.getHistorico as any).mockResolvedValue(historicoMock)

    render(
      <HistoricoModal
        open={true}
        bemId={1}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Carregando histórico...')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    )

    expect(screen.getByText(/De:\s*Mesa/i)).toBeInTheDocument()
    expect(screen.getByText(/Para:\s*Mesa Nova/i)).toBeInTheDocument()
  })

  it('deve chamar onClose ao clicar no botão X', async () => {
    ;(bemService.getHistorico as any).mockResolvedValue(historicoMock)

    const onClose = vi.fn()

    render(
      <HistoricoModal
        open={true}
        bemId={1}
        onClose={onClose}
      />
    )

    await waitFor(() =>
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    )

    // pega o único botão do header
    const closeButton = screen.getAllByRole('button')[0]

    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('deve traduzir status corretamente', async () => {
    (bemService.getHistorico as any).mockResolvedValue([
        {
        alterado_em: '2024-01-01T10:00:00',
        alterado_por: 1,
        alterado_por_nome: 'João Silva',
        acoes: [
            {
            campo: 'status',
            valor_antigo: 'bloqueado',
            valor_novo: 'aprovado',
            },
        ],
        },
    ])

    render(
        <HistoricoModal
        open={true}
        bemId={1}
        onClose={vi.fn()}
        />
    )

    await waitFor(() =>
        expect(screen.getByText('João Silva')).toBeInTheDocument()
    )

    expect(
        screen.getByText(/De:\s*Bloqueado para movimentação/i)
    ).toBeInTheDocument()

    expect(
        screen.getByText(/Para:\s*Aprovado/i)
    ).toBeInTheDocument()
    })

    it('deve traduzir boolean corretamente', async () => {
        (bemService.getHistorico as any).mockResolvedValue([
            {
            alterado_em: '2024-01-01T10:00:00',
            alterado_por: 1,
            alterado_por_nome: 'João Silva',
            acoes: [
                {
                campo: 'bloqueado_conciliacao',
                valor_antigo: 'False',
                valor_novo: 'True',
                },
            ],
            },
        ])

        render(
            <HistoricoModal
            open={true}
            bemId={1}
            onClose={vi.fn()}
            />
        )

        await waitFor(() =>
            expect(screen.getByText('João Silva')).toBeInTheDocument()
        )

        expect(screen.getByText(/De:\s*Não/i)).toBeInTheDocument()
        expect(screen.getByText(/Para:\s*Sim/i)).toBeInTheDocument()
        })
})