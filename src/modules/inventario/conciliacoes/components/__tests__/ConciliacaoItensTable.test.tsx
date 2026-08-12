import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConciliacaoItensTable } from '../ConciliacaoItensTable';
import type { ConciliacaoItem } from '../../types/conciliacoes.types';

const baseItem: ConciliacaoItem = {
  id: 42,
  conciliacao: 1,
  conciliacao_numero: '001.0002/2026/005',
  conciliacao_status: 'em_aberto',
  unidade_administrativa: 7,
  unidade_administrativa_sigla: 'COTIC',
  bem: {
    id: 123,
    numero_patrimonial: '001.052485928-0',
    nome: 'POLTRONA FIXA',
    descricao: 'Poltrona fixa de escritório',
    marca: 'Flexform',
    modelo: 'Diretor',
    valor_unitario: '1200.00',
    status: 'ativo',
    localizacao: 'Sala 12',
    bloqueado_conciliacao: false,
  },
  situacao: 'encontrado_sem_divergencia',
  situacao_display: 'Encontrado sem divergência',
  observacao: '',
  divergencia: '',
  tem_ocorrencia: false,
  permite_registrar_ocorrencia: true,
  atualizado_por: null,
  atualizado_por_nome: '',
  atualizado_em: '2026-01-15T10:00:00Z',
};

const baseProps = {
  itens: [] as ConciliacaoItem[],
  loading: false,
  page: 1,
  pages: [{ type: 'page' as const, id: '1', value: 1 }],
  totalPages: 1,
  onPageChange: vi.fn(),
  onSort: vi.fn(),
};

describe('ConciliacaoItensTable', () => {
  it('exibe estado de carregamento e vazio', () => {
    const { rerender } = render(<ConciliacaoItensTable {...baseProps} loading />);

    expect(screen.getByText(/Carregando itens/i)).toBeInTheDocument();

    rerender(<ConciliacaoItensTable {...baseProps} loading={false} />);

    expect(
      screen.getByText(/Nenhum item encontrado para esta conciliação/i),
    ).toBeInTheDocument();
  });

  it('renderiza os dados formatados do item', () => {
    render(<ConciliacaoItensTable {...baseProps} itens={[baseItem]} />);

    expect(screen.getByText('001.052485928-0')).toBeInTheDocument();
    expect(screen.getByText('POLTRONA FIXA')).toBeInTheDocument();
    expect(screen.getByTestId('item-situacao-encontrado_sem_divergencia')).toBeInTheDocument();
  });

  it('combina observacao e divergencia na coluna "Observação / Divergência"', () => {
    const item: ConciliacaoItem = {
      ...baseItem,
      id: 99,
      situacao: 'divergente',
      observacao: 'item não encontrado',
      divergencia: 'mudar a marca',
    };

    render(<ConciliacaoItensTable {...baseProps} itens={[item]} />);

    expect(screen.getByText('item não encontrado / mudar a marca')).toBeInTheDocument();
  });

  it('renderiza string vazia quando observacao e divergencia estao vazias', () => {
    const item: ConciliacaoItem = {
      ...baseItem,
      id: 100,
      observacao: '',
      divergencia: '',
    };

    const { container } = render(<ConciliacaoItensTable {...baseProps} itens={[item]} />);

    const observacaoCell = container.querySelectorAll('tbody td')[3];
    expect(observacaoCell?.textContent).toBe('');
  });

  it('exibe botao de visualizar item (placeholder) sem disparar onView', () => {
    const onPageChange = vi.fn();

    render(
      <ConciliacaoItensTable
        {...baseProps}
        itens={[baseItem]}
        onPageChange={onPageChange}
      />,
    );

    const actionButton = screen.getByTestId('conciliacao-item-action-42');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveAttribute(
      'aria-label',
      'Visualizar item 001.052485928-0',
    );
    expect(actionButton.querySelector('svg')).toHaveClass(
      'size-[22px]',
      'text-[#00703C]',
    );

    fireEvent.click(actionButton);

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('dispara onSelectItem ao clicar no botao de acao quando informado', () => {
    const onSelectItem = vi.fn();

    render(
      <ConciliacaoItensTable
        {...baseProps}
        itens={[baseItem]}
        onSelectItem={onSelectItem}
      />,
    );

    fireEvent.click(screen.getByTestId('conciliacao-item-action-42'));

    expect(onSelectItem).toHaveBeenCalledTimes(1);
    expect(onSelectItem).toHaveBeenCalledWith(baseItem);
  });

  it('dispara onSort ao clicar em colunas ordenaveis', () => {
    const onSort = vi.fn();

    render(
      <ConciliacaoItensTable
        {...baseProps}
        itens={[baseItem]}
        onSort={onSort}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Número Patrimonial/i }));
    fireEvent.click(screen.getByRole('button', { name: /Nome do bem/i }));
    fireEvent.click(screen.getByRole('button', { name: /Situação/i }));

    expect(onSort).toHaveBeenCalledWith('bem__numero_patrimonial');
    expect(onSort).toHaveBeenCalledWith('bem__nome');
    expect(onSort).toHaveBeenCalledWith('situacao');
  });

  it('dispara onPageChange ao clicar em paginas', () => {
    const onPageChange = vi.fn();

    render(
      <ConciliacaoItensTable
        {...baseProps}
        page={1}
        pages={[
          { type: 'page' as const, id: '1', value: 1 },
          { type: 'page' as const, id: '2', value: 2 },
        ]}
        totalPages={2}
        itens={[baseItem]}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renderiza multiplos itens com chaves corretas', () => {
    const item1: ConciliacaoItem = { ...baseItem, id: 1, bem: { ...baseItem.bem, nome: 'MESA' } };
    const item2: ConciliacaoItem = {
      ...baseItem,
      id: 2,
      bem: { ...baseItem.bem, nome: 'CADEIRA' },
      situacao: 'nao_encontrado',
    };

    render(<ConciliacaoItensTable {...baseProps} itens={[item1, item2]} />);

    expect(screen.getByText('MESA')).toBeInTheDocument();
    expect(screen.getByText('CADEIRA')).toBeInTheDocument();
    expect(screen.getByTestId('item-situacao-encontrado_sem_divergencia')).toBeInTheDocument();
    expect(screen.getByTestId('item-situacao-nao_encontrado')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacao-item-action-1')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacao-item-action-2')).toBeInTheDocument();
  });
});
