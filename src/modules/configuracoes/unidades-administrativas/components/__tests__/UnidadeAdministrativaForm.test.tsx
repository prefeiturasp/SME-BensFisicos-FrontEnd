import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { UnidadeAdministrativaForm } from '../UnidadeAdministrativaForm';
import type { UnidadeAdministrativaFormData } from '../../validators/unidade-administrativa-form.schema';

interface StatusResetFormProps {
  nextStatus: string;
}

function StatusResetForm({ nextStatus }: Readonly<StatusResetFormProps>) {
  const form = useForm<UnidadeAdministrativaFormData>({
    defaultValues: {
      codigoFinal: '093',
      sigla: 'MA',
      nome: 'MANUTENCAO',
      status: 'ativa',
    },
  });

  useEffect(() => {
    form.reset({
      codigoFinal: '093',
      sigla: 'MA',
      nome: 'MANUTENCAO',
      status: nextStatus as UnidadeAdministrativaFormData['status'],
    });
  }, [form, nextStatus]);

  return (
    <UnidadeAdministrativaForm
      form={form}
      uoCodigo='01.16.10'
      uoNome='SECRETARIA MUNICIPAL DE EDUCACAO'
      submitting={false}
      disabled
      onSubmit={() => {}}
    />
  );
}

interface RenderFormOptions {
  disabled?: boolean;
  submitting?: boolean;
  rootError?: string;
  uoNome?: string;
  defaultValues?: Partial<UnidadeAdministrativaFormData>;
}

function renderForm(options: Readonly<RenderFormOptions> = {}) {
  const { disabled = false, submitting = false, rootError, uoNome = 'SECRETARIA MUNICIPAL DE EDUCACAO', defaultValues } = options;

  function FormHarness() {
    const form = useForm<UnidadeAdministrativaFormData>({
      defaultValues: {
        codigoFinal: '093',
        sigla: 'MA',
        nome: 'MANUTENCAO',
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
      <UnidadeAdministrativaForm
        form={form}
        uoCodigo='01.16.10'
        uoNome={uoNome}
        submitting={submitting}
        disabled={disabled}
        onSubmit={() => {}}
      />
    );
  }

  return render(<FormHarness />);
}

describe('UnidadeAdministrativaForm', () => {
  it('exibe Inativa quando o status chega por reset', async () => {
    render(<StatusResetForm nextStatus='inativa' />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Inativa');
    });
  });

  it('sanitiza campos e exibe erro raiz com fallback de unidade orçamentária', async () => {
    renderForm({
      rootError: 'Erro retornado pela API.',
      uoNome: '',
      defaultValues: { status: undefined as never },
    });

    expect(screen.getByText('Erro retornado pela API.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Unidade orçamentária não disponível')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Selecione o status');

    const codigoInput = screen.getByPlaceholderText('286');
    const siglaInput = screen.getByPlaceholderText('Digite a sigla da unidade administrativa');
    const nomeInput = screen.getByPlaceholderText('Digite o nome da unidade administrativa');

    fireEvent.change(codigoInput, { target: { value: 'a1b2345' } });
    fireEvent.change(siglaInput, { target: { value: 'dipat' } });
    fireEvent.change(nomeInput, { target: { value: 'divisão de patrimônio' } });

    expect(codigoInput).toHaveValue('123');
    expect(siglaInput).toHaveValue('DIPAT');
    expect(nomeInput).toHaveValue('DIVISÃO DE PATRIMÔNIO');
  });

  it('desabilita os campos editáveis quando está submetendo', () => {
    renderForm({ submitting: true });

    expect(screen.getByPlaceholderText('286')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByPlaceholderText('Digite a sigla da unidade administrativa')).toBeDisabled();
    expect(screen.getByPlaceholderText('Digite o nome da unidade administrativa')).toBeDisabled();
  });
});
