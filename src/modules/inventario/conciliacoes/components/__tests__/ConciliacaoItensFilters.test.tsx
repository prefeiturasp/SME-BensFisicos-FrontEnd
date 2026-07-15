import { fireEvent, render, screen } from '@testing-library/react';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConciliacaoItensFilters } from '../ConciliacaoItensFilters';
import type { ConciliacaoItemSituacaoFilter } from '../../types/conciliacoes.types';

vi.mock('@/components/ui/select', () => {
  function Select({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) {
    const childTestId = Children.toArray(children).find(
      (child): child is ReactElement<{ 'data-testid'?: string }> =>
        isValidElement(child) && 'data-testid' in (child.props as object),
    )?.props?.['data-testid'];

    return (
      <select
        data-testid={childTestId ?? `select-${value}`}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {children}
      </select>
    );
  }

  return {
    Select,
    SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
      <option value={value}>{children}</option>
    ),
  };
});

const baseProps = {
  numeroPatrimonial: '',
  nome: '',
  situacao: 'todos' as ConciliacaoItemSituacaoFilter,
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

  it('dispara onSituacaoChange ao alterar o select de situacao', () => {
    const onSituacaoChange = vi.fn();

    render(
      <ConciliacaoItensFilters {...baseProps} onSituacaoChange={onSituacaoChange} />,
    );

    fireEvent.change(screen.getByTestId('conciliacao-itens-situacao-select'), {
      target: { value: 'nao_encontrado' },
    });

    expect(onSituacaoChange).toHaveBeenCalledWith('nao_encontrado');
  });

  it('expõe opcoes de situacao incluindo "Todas"', () => {
    render(<ConciliacaoItensFilters {...baseProps} />);

    expect(screen.getByRole('option', { name: 'Todas' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Encontrado sem divergência' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Não encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Divergente' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Em processo de baixa' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Baixa Física' })).toBeInTheDocument();
  });

  it('aceita valores controlados via props', () => {
    const { rerender } = render(<ConciliacaoItensFilters {...baseProps} />);

    expect(screen.getByTestId('conciliacao-itens-numero-input')).toHaveValue('');
    expect(screen.getByTestId('conciliacao-itens-nome-input')).toHaveValue('');
    expect(screen.getByTestId('conciliacao-itens-situacao-select')).toHaveValue('todos');

    rerender(
      <ConciliacaoItensFilters
        {...baseProps}
        numeroPatrimonial='001.004034553-9'
        nome='POLTRONA FIXA'
        situacao='divergente'
      />,
    );

    expect(screen.getByTestId('conciliacao-itens-numero-input')).toHaveValue('001.004034553-9');
    expect(screen.getByTestId('conciliacao-itens-nome-input')).toHaveValue('POLTRONA FIXA');
    expect(screen.getByTestId('conciliacao-itens-situacao-select')).toHaveValue('divergente');
  });
});
