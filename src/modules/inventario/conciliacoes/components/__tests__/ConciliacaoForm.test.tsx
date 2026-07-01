import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ConciliacaoForm } from '../ConciliacaoForm';
import {
  conciliacaoFormSchema,
  type ConciliacaoFormData,
} from '../../validators/conciliacao-form.schema';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
});

function TestForm({
  onSubmit = vi.fn(),
  unidadeAdministrativaLabel = '00.00.00.002 - COTIC',
  tipoConciliacaoLabel = 'Eventual',
}: Readonly<{
  onSubmit?: (values: ConciliacaoFormData) => void | Promise<void>;
  unidadeAdministrativaLabel?: string;
  tipoConciliacaoLabel?: string;
}>) {
  const form = useForm<ConciliacaoFormData>({
    resolver: zodResolver(conciliacaoFormSchema),
    mode: 'onChange',
    defaultValues: { periodoFinal: '' },
  });

  return (
    <ConciliacaoForm
      form={form}
      unidadeAdministrativaLabel={unidadeAdministrativaLabel}
      tipoConciliacaoLabel={tipoConciliacaoLabel}
      submitting={false}
      onSubmit={onSubmit}
    />
  );
}

describe('ConciliacaoForm', () => {
  it('renderiza campos readonly e o datepicker de periodo final', () => {
    render(<TestForm />);

    const uaInput = screen.getByLabelText('Unidade Administrativa') as HTMLInputElement;
    const tipoInput = screen.getByLabelText('Tipo') as HTMLInputElement;

    expect(uaInput.value).toBe('00.00.00.002 - COTIC');
    expect(uaInput).toBeDisabled();

    expect(tipoInput.value).toBe('Eventual');
    expect(tipoInput).toBeDisabled();

    expect(screen.getByLabelText('Período Final')).toBeInTheDocument();
  });

  it('exibe placeholder do datepicker antes da selecao', () => {
    render(<TestForm />);

    expect(screen.getByText('dd/mm/aaaa')).toBeInTheDocument();
  });

  it('abre o calendario ao clicar no botao de data', async () => {
    render(<TestForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar data' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('exibe o botao Hoje dentro do calendario', async () => {
    render(<TestForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar data' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hoje' })).toBeInTheDocument();
    });
  });

  it('renderiza placeholder da UA quando nao disponivel', () => {
    render(<TestForm unidadeAdministrativaLabel='' />);

    const uaInput = screen.getByLabelText('Unidade Administrativa') as HTMLInputElement;
    expect(uaInput.placeholder).toBe('Não disponível');
  });
});
