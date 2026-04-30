import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { UnidadeOrcamentariaForm } from '../UnidadeOrcamentariaForm';
import type { UnidadeOrcamentariaFormData } from '../../validators/unidade-orcamentaria-form.schema';

interface StatusResetFormProps {
  nextStatus: string;
}

function StatusResetForm({ nextStatus }: Readonly<StatusResetFormProps>) {
  const form = useForm<UnidadeOrcamentariaFormData>({
    defaultValues: {
      codigo: '10.10.10',
      sigla: 'UO1',
      nome: 'UNIDADE ORCAMENTARIA 1',
      status: 'ativa',
    },
  });

  useEffect(() => {
    form.reset({
      codigo: '10.10.10',
      sigla: 'UO1',
      nome: 'UNIDADE ORCAMENTARIA 1',
      status: nextStatus as UnidadeOrcamentariaFormData['status'],
    });
  }, [form, nextStatus]);

  return <UnidadeOrcamentariaForm form={form} submitting={false} disabled onSubmit={() => {}} />;
}

interface RenderFormOptions {
  disabled?: boolean;
  submitting?: boolean;
  rootError?: string;
  defaultValues?: Partial<UnidadeOrcamentariaFormData>;
}

function renderForm(options: Readonly<RenderFormOptions> = {}) {
  const { disabled = false, submitting = false, rootError, defaultValues } = options;

  function FormHarness() {
    const form = useForm<UnidadeOrcamentariaFormData>({
      defaultValues: {
        codigo: '10.10.10',
        sigla: 'UO1',
        nome: 'UNIDADE ORCAMENTARIA 1',
        status: 'ativa',
        ...defaultValues,
      },
    });

    useEffect(() => {
      if (!rootError) {
        return;
      }

      form.setError('root.serverError', { type: 'server', message: rootError });
    }, [form]);

    return (
      <UnidadeOrcamentariaForm
        form={form}
        submitting={submitting}
        disabled={disabled}
        onSubmit={() => {}}
      />
    );
  }

  return render(<FormHarness />);
}

describe('UnidadeOrcamentariaForm', () => {
  it('exibe Inativa quando o status chega por reset', async () => {
    render(<StatusResetForm nextStatus='inativa' />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Inativa');
    });
  });

  it('mascara codigo, converte sigla e nome para caixa alta e exibe erro raiz', () => {
    renderForm({
      rootError: 'Erro retornado pela API.',
      defaultValues: { status: undefined as never },
    });

    expect(screen.getByText('Erro retornado pela API.')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Selecione o status');

    const codigoInput = screen.getByPlaceholderText('00.00.00');
    const siglaInput = screen.getByPlaceholderText('Digite a sigla da unidade orçamentária');
    const nomeInput = screen.getByPlaceholderText('Digite o nome da unidade orçamentária');

    fireEvent.change(codigoInput, { target: { value: 'a1b23456' } });
    fireEvent.change(siglaInput, { target: { value: 'uo60' } });
    fireEvent.change(nomeInput, { target: { value: 'unidade orcamentaria 60' } });

    expect(codigoInput).toHaveValue('12.34.56');
    expect(siglaInput).toHaveValue('UO60');
    expect(nomeInput).toHaveValue('UNIDADE ORCAMENTARIA 60');
  });

  it('desabilita os campos editáveis quando está submetendo', () => {
    renderForm({ submitting: true });

    expect(screen.getByPlaceholderText('00.00.00')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByPlaceholderText('Digite a sigla da unidade orçamentária')).toBeDisabled();
    expect(screen.getByPlaceholderText('Digite o nome da unidade orçamentária')).toBeDisabled();
  });
});