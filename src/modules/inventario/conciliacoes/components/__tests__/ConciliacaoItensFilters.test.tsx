import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConciliacaoItensFilters } from '../ConciliacaoItensFilters';
import type { ConciliacaoItemSituacaoFilter } from '../../types/conciliacoes.types';

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    disabled,
    onCheckedChange,
  }: {
    checked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type='checkbox'
      checked={!!checked}
      onChange={(event) => {
        if (disabled) return
        onCheckedChange?.(event.target.checked)
      }}
    />
  ),
}));

const baseProps = {
  numeroPatrimonial: '',
  nome: '',
  situacao: [] as ConciliacaoItemSituacaoFilter,
  onNumeroPatrimonialChange: vi.fn(),
  onNomeChange: vi.fn(),
  onSituacaoChange: vi.fn(),
};

describe('ConciliacaoItensFilters', () => {
  it('renderiza labels, placeholders e filtro de situacao', () => {
    render(<ConciliacaoItensFilters {...baseProps} />);

    expect(screen.getByText('Filtrar por Número Patrimonial')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por Nome do bem')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por Situação')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Digite o Número Patrimonial'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite o Nome do bem')).toBeInTheDocument();
    expect(screen.getByTestId('conciliacao-itens-situacao-select')).toBeInTheDocument();
  });

  it('exibe "Todas" no botao quando nenhuma situacao esta selecionada', () => {
    render(<ConciliacaoItensFilters {...baseProps} />);

    expect(screen.getByTestId('conciliacao-itens-situacao-select')).toHaveTextContent('Todas');
  });

  it('dispara onNumeroPatrimonialChange ao digitar', () => {
    const onNumeroPatrimonialChange = vi.fn();

    render(
      <ConciliacaoItensFilters
        {...baseProps}
        onNumeroPatrimonialChange={onNumeroPatrimonialChange}
      />,
    );

    fireEvent.change(screen.getByTestId('conciliacao-itens-numero-input'), {
      target: { value: '001.052485928-0' },
    });

    expect(onNumeroPatrimonialChange).toHaveBeenCalledWith('001.052485928-0');
  });

  it('dispara onNomeChange ao digitar', () => {
    const onNomeChange = vi.fn();

    render(<ConciliacaoItensFilters {...baseProps} onNomeChange={onNomeChange} />);

    fireEvent.change(screen.getByTestId('conciliacao-itens-nome-input'), {
      target: { value: 'POLTRONA' },
    });

    expect(onNomeChange).toHaveBeenCalledWith('POLTRONA');
  });

  it('abre o dropdown com as opcoes de situacao ao clicar no botao', () => {
    render(<ConciliacaoItensFilters {...baseProps} />);

    fireEvent.click(screen.getByTestId('conciliacao-itens-situacao-select'));

    expect(screen.getByRole('checkbox', { name: 'Encontrado sem divergência' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Não encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Divergente' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Em processo de baixa' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Baixa Física' })).toBeInTheDocument();
  });

  it('marca multiplas situacoes e reflete todas as selecoes no estado', () => {
    const onSituacaoChange = vi.fn();
    let current = [] as ConciliacaoItemSituacaoFilter;
    const renderWith = (value: ConciliacaoItemSituacaoFilter) => (
      <ConciliacaoItensFilters
        {...baseProps}
        situacao={value}
        onSituacaoChange={(next) => {
          current = next;
          onSituacaoChange(next);
        }}
      />
    );

    const { rerender } = render(renderWith(current));

    fireEvent.click(screen.getByTestId('conciliacao-itens-situacao-select'));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Divergente' }));
    expect(onSituacaoChange).toHaveBeenLastCalledWith(['divergente']);

    rerender(renderWith(current));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Não encontrado' }));
    expect(onSituacaoChange).toHaveBeenLastCalledWith(['divergente', 'nao_encontrado']);
  });

  it('exibe os rotulos das situacoes selecionadas separados por virgula', () => {
    render(
      <ConciliacaoItensFilters
        {...baseProps}
        situacao={['divergente', 'nao_encontrado']}
      />,
    );

    expect(screen.getByTestId('conciliacao-itens-situacao-select')).toHaveTextContent(
      'Divergente, Não encontrado',
    );
  });

  it('exibe "Todas" ao desmarcar todas as situacoes selecionadas', () => {
    const onSituacaoChange = vi.fn();
    let current = ['divergente', 'nao_encontrado'] as ConciliacaoItemSituacaoFilter;
    const renderWith = (value: ConciliacaoItemSituacaoFilter) => (
      <ConciliacaoItensFilters
        {...baseProps}
        situacao={value}
        onSituacaoChange={(next) => {
          current = next;
          onSituacaoChange(next);
        }}
      />
    );

    const { rerender } = render(renderWith(current));

    fireEvent.click(screen.getByTestId('conciliacao-itens-situacao-select'));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Divergente' }));
    expect(onSituacaoChange).toHaveBeenLastCalledWith(['nao_encontrado']);

    rerender(renderWith(current));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Não encontrado' }));
    expect(onSituacaoChange).toHaveBeenLastCalledWith([]);
  });

  it('aceita valores controlados via props', () => {
    const { rerender } = render(<ConciliacaoItensFilters {...baseProps} />);

    expect(screen.getByTestId('conciliacao-itens-numero-input')).toHaveValue('');
    expect(screen.getByTestId('conciliacao-itens-nome-input')).toHaveValue('');

    rerender(
      <ConciliacaoItensFilters
        {...baseProps}
        numeroPatrimonial='001.004034553-9'
        nome='POLTRONA FIXA'
        situacao={['divergente']}
      />,
    );

    expect(screen.getByTestId('conciliacao-itens-numero-input')).toHaveValue('001.004034553-9');
    expect(screen.getByTestId('conciliacao-itens-nome-input')).toHaveValue('POLTRONA FIXA');
    expect(screen.getByTestId('conciliacao-itens-situacao-select')).toHaveTextContent('Divergente');
  });
});
