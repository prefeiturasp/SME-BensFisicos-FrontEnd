import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/api/http';
import { HistoricoConsultaModal } from '../HistoricoConsultaModal';

vi.mock('@/api/http', () => ({ api: { get: vi.fn() } }));

const onClose = vi.fn();

describe('HistoricoConsultaModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra ausencia de historico sem atribuir autoria', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    render(<HistoricoConsultaModal endpoint='/unidades/1/historico/' onClose={onClose} />);
    expect(await screen.findByText('Nenhum histórico disponível para este registro.')).toBeInTheDocument();
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument();
  });

  it('mostra autor, RF, data e valores de uma alteracao', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{
      alterado_em: '2026-09-22T12:00:00Z',
      alterado_por: 7,
      alterado_por_nome: 'Maria da Silva',
      alterado_por_rf: 'F123456',
      acoes: [{ campo: 'nome', valor_antigo: 'Antes', valor_novo: 'Depois' }],
    }] });
    render(<HistoricoConsultaModal endpoint='/unidades/1/historico/' onClose={onClose} />);
    expect(await screen.findByText('Maria da Silva (RF F123456)')).toBeInTheDocument();
    expect(screen.getByText('De: Antes → Para: Depois')).toBeInTheDocument();
    expect(screen.getByText(/22\/09\/2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar histórico' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('nao inventa usuario para evento sem autor', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{
      alterado_em: '2026-09-22T12:00:00Z',
      alterado_por: null,
      alterado_por_nome: null,
      alterado_por_rf: null,
      acoes: [{ campo: 'acao', valor_antigo: '', valor_novo: 'criado' }],
    }] });
    render(<HistoricoConsultaModal endpoint='/unidades/1/historico/' onClose={onClose} />);
    expect(await screen.findByText('Informação não disponível')).toBeInTheDocument();
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument();
  });

  it('identifica exclusao pelo nome correto na lista de ocorrencias', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{
      alterado_em: '2026-09-22T12:00:00Z',
      alterado_por: 7,
      alterado_por_nome: 'Maria da Silva',
      alterado_por_rf: 'F123456',
      acoes: [{ campo: 'acao', valor_antigo: '', valor_novo: 'excluido' }],
    }] });

    render(<HistoricoConsultaModal endpoint='/unidades/1/historico/' onClose={onClose} />);

    expect((await screen.findAllByText('Registro excluído')).length).toBe(2);
  });

  it('mostra falha de carregamento separada de historico vazio', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Falha'));
    render(<HistoricoConsultaModal endpoint='/unidades/1/historico/' onClose={onClose} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o histórico.'));
    expect(screen.queryByText('Nenhum histórico disponível para este registro.')).not.toBeInTheDocument();
  });
});
