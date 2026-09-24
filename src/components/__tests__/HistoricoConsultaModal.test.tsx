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
    expect(await screen.findByText('Nenhum histórico encontrado.')).toBeInTheDocument();
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
    expect(await screen.findAllByText('Usuário: Maria da Silva (RF F123456)')).toHaveLength(2);
    expect(screen.getAllByText('M')).toHaveLength(2);
    expect(screen.getByText('Usuário')).toBeInTheDocument();
    expect(screen.getByText('De: Antes → Para: Depois')).toBeInTheDocument();
    expect(screen.getAllByText('22/09/2026')).toHaveLength(2);
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
    expect(await screen.findAllByText('Usuário: Informação não disponível')).toHaveLength(2);
    expect(screen.getAllByText('?')).toHaveLength(2);
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument();
  });

  it('atualiza o painel de ações ao selecionar outra ocorrência', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [
      {
        alterado_em: '2026-09-22T12:00:00Z',
        alterado_por: 7,
        alterado_por_nome: 'Maria da Silva',
        alterado_por_rf: 'F123456',
        acoes: [{ campo: 'nome', valor_antigo: 'Antes', valor_novo: 'Depois' }],
      },
      {
        alterado_em: '2026-09-21T12:00:00Z',
        alterado_por: 8,
        alterado_por_nome: 'João Santos',
        alterado_por_rf: 'F654321',
        acoes: [{ campo: 'acao', valor_antigo: '', valor_novo: 'criado' }],
      },
    ] });

    render(<HistoricoConsultaModal endpoint='/unidades/1/historico/' onClose={onClose} />);
    await screen.findByText('De: Antes → Para: Depois');
    fireEvent.click(screen.getByRole('button', { name: /Registro criado/ }));

    expect(screen.queryByText('De: Antes → Para: Depois')).not.toBeInTheDocument();
    expect(screen.getAllByText('Usuário: João Santos (RF F654321)')).toHaveLength(2);
    expect(screen.getAllByText('J')).toHaveLength(2);
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
    expect(screen.queryByText('Nenhum histórico encontrado.')).not.toBeInTheDocument();
  });
});
