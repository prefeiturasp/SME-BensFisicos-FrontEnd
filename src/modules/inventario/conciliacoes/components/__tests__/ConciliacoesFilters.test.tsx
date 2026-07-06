import { fireEvent, render, screen } from '@testing-library/react';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConciliacoesFilters } from '../ConciliacoesFilters';
import type {
  ConciliacaoStatusFilter,
  ConciliacaoTipoFilter,
} from '../../types/conciliacoes.types';

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
  search: '',
  anoVigencia: '',
  tipo: 'todos' as ConciliacaoTipoFilter,
  status: 'todos' as ConciliacaoStatusFilter,
  onSearchChange: vi.fn(),
  onAnoVigenciaChange: vi.fn(),
  onTipoChange: vi.fn(),
  onStatusChange: vi.fn(),
};

describe('ConciliacoesFilters', () => {
  it('renderiza os campos com labels e placeholders esperados', () => {
    render(<ConciliacoesFilters {...baseProps} />);

    expect(screen.getByText('Buscar Conciliação')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Digite o número ou a unidade administrativa'),
    ).toBeInTheDocument();

    expect(screen.getByText('Filtrar por Ano de Vigência')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por Tipo')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por Status')).toBeInTheDocument();
  });

  it('dispara onSearchChange ao digitar na busca', () => {
    const onSearchChange = vi.fn();
    render(<ConciliacoesFilters {...baseProps} onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByTestId('conciliacoes-search-input'), {
      target: { value: 'CONC-2026' },
    });

    expect(onSearchChange).toHaveBeenCalledWith('CONC-2026');
  });

  it('dispara onAnoVigenciaChange ao selecionar um ano', () => {
    const onAnoVigenciaChange = vi.fn();
    render(<ConciliacoesFilters {...baseProps} onAnoVigenciaChange={onAnoVigenciaChange} />);

    const anoSelect = screen.getByTestId('conciliacoes-ano-select');
    fireEvent.change(anoSelect, {
      target: { value: '2026' },
    });

    expect(onAnoVigenciaChange).toHaveBeenCalledWith('2026');
  });

  it('dispara onAnoVigenciaChange com string vazia ao selecionar "Todos"', () => {
    const onAnoVigenciaChange = vi.fn();
    render(
      <ConciliacoesFilters
        {...baseProps}
        anoVigencia='2026'
        onAnoVigenciaChange={onAnoVigenciaChange}
      />,
    );

    const anoSelect = screen.getByTestId('conciliacoes-ano-select');
    fireEvent.change(anoSelect, {
      target: { value: 'todos' },
    });

    expect(onAnoVigenciaChange).toHaveBeenCalledWith('');
  });

  it('altera o tipo de conciliacao via select', () => {
    const onTipoChange = vi.fn();

    render(<ConciliacoesFilters {...baseProps} onTipoChange={onTipoChange} />);

    const tipoSelect = screen.getByTestId('conciliacoes-tipo-select');
    fireEvent.change(tipoSelect, {
      target: { value: 'eventual' },
    });

    expect(onTipoChange).toHaveBeenCalledWith('eventual');
  });

  it('altera o status de conciliacao via select', () => {
    const onStatusChange = vi.fn();

    render(<ConciliacoesFilters {...baseProps} onStatusChange={onStatusChange} />);

    const statusSelect = screen.getByTestId('conciliacoes-status-select');
    fireEvent.change(statusSelect, {
      target: { value: 'fechado' },
    });

    expect(onStatusChange).toHaveBeenCalledWith('fechado');
  });

  it('expõe as opcoes de tipo e status', () => {
    render(<ConciliacoesFilters {...baseProps} />);

    expect(screen.getAllByRole('option', { name: 'Todos' }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('option', { name: 'Anual' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Eventual' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Aberta' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fechada' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', {
        name: 'Fechada pelo administrador - Não Conciliado',
      }),
    ).toBeInTheDocument();
  });

  it('aceita valores controlados pelo parent', () => {
    const { rerender } = render(<ConciliacoesFilters {...baseProps} />);

    expect(screen.getByTestId('conciliacoes-search-input')).toHaveValue('');

    rerender(
      <ConciliacoesFilters
        {...baseProps}
        search='CONC'
        anoVigencia='2026'
        tipo='eventual'
        status='fechado'
      />,
    );

    expect(screen.getByTestId('conciliacoes-search-input')).toHaveValue('CONC');
  });
});
