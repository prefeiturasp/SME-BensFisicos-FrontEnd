import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UnidadesOrcamentariasFilters } from '../UnidadesOrcamentariasFilters';

vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <select value={value} onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));

describe('UnidadesOrcamentariasFilters', () => {
  it('dispara callbacks dos campos de texto', () => {
    const onCodigoChange = vi.fn();
    const onNomeOuSiglaChange = vi.fn();

    render(
      <UnidadesOrcamentariasFilters
        codigo=''
        nomeOuSigla=''
        status='todos'
        onCodigoChange={onCodigoChange}
        onNomeOuSiglaChange={onNomeOuSiglaChange}
        onStatusChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Digite o código da UO ou do Órgão'), {
      target: { value: '10.10.10' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite o nome ou sigla da UA'), {
      target: { value: 'UO1' },
    });

    expect(onCodigoChange).toHaveBeenCalledWith('10.10.10');
    expect(onNomeOuSiglaChange).toHaveBeenCalledWith('UO1');
  });

  it('dispara callback do select simples de status', () => {
    const onStatusChange = vi.fn();

    render(
      <UnidadesOrcamentariasFilters
        codigo=''
        nomeOuSigla=''
        status='todos'
        onCodigoChange={vi.fn()}
        onNomeOuSiglaChange={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'false' },
    });

    expect(onStatusChange).toHaveBeenCalledWith('false');
  });
});