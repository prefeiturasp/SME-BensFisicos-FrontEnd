import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ParametroConciliacaoForm } from '../ParametroConciliacaoForm';
import {
  parametroConciliacaoAnualSchema,
  type ParametroConciliacaoAnualFormData,
} from '../../validators/parametro-conciliacao-anual.schema';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
});

function TestForm() {
  const form = useForm<ParametroConciliacaoAnualFormData>({
    resolver: zodResolver(parametroConciliacaoAnualSchema),
    mode: 'onChange',
    defaultValues: {
      anoReferencia: '',
      periodoInicial: '',
      periodoFinal: '',
      ativo: true,
    },
  });

  return (
    <ParametroConciliacaoForm
      form={form}
      unidadeOrcamentariaLabel='01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO'
      submitting={false}
      onSubmit={vi.fn()}
    />
  );
}

describe('ParametroConciliacaoForm', () => {
  it('fecha o calendario ao clicar fora', async () => {
    render(<TestForm />);

    fireEvent.click(screen.getAllByLabelText('Selecionar data')[0]);

    expect(screen.getByText(/Hoje/)).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/Hoje/)).not.toBeInTheDocument();
    });
  });

  it('oculta a mensagem de ajuda quando o campo exibe erro', async () => {
    render(<TestForm />);

    const periodoInicial = screen.getAllByPlaceholderText('dd/mm/aaaa')[0];
    const periodoFinal = screen.getAllByPlaceholderText('dd/mm/aaaa')[1];

    fireEvent.change(periodoInicial, { target: { value: '30/04/2026' } });
    fireEvent.change(periodoFinal, { target: { value: '01/04/2026' } });

    await waitFor(() => {
      const messages = screen.getAllByText(
        'Data final em que conciliações anuais podem ser criadas/fechadas.',
      );
      expect(messages).toHaveLength(1);
    });
  });
});
