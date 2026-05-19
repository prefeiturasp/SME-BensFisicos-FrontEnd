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
      sigla_orgao: 'SME',
      orgao: 'SECRETARIA MUNICIPAL DE EDUCACAO',
      codigo_orgao: '10.10',
      status: 'ativa',
    },
  });

  useEffect(() => {
    form.reset({
      codigo: '10.10.10',
      sigla: 'UO1',
      nome: 'UNIDADE ORCAMENTARIA 1',
      sigla_orgao: 'SME',
      orgao: 'SECRETARIA MUNICIPAL DE EDUCACAO',
      codigo_orgao: '10.10',
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
        sigla_orgao: 'SME',
        orgao: 'SECRETARIA MUNICIPAL DE EDUCACAO',
        codigo_orgao: '10.10',
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

  it('mantém o código livre, formata código do órgão, converte textos para caixa alta e exibe erro raiz', () => {
    renderForm({
      rootError: 'Erro retornado pela API.',
      defaultValues: { status: undefined as never },
    });

    expect(screen.getByText('Erro retornado pela API.')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Selecione o status');

    const codigoInput = screen.getByPlaceholderText('Informe o código da UO');
    const siglaInput = screen.getByPlaceholderText('Informe a sigla da UO');
    const nomeInput = screen.getByPlaceholderText('Informe o nome da UO');
    const siglaOrgaoInput = screen.getByPlaceholderText('Informe a sigla do órgão');
    const codigoOrgaoInput = screen.getByPlaceholderText('Informe o código do órgão');
    const orgaoInput = screen.getByPlaceholderText('Informe o nome do órgão');

    fireEvent.change(codigoInput, { target: { value: 'AA-01.16.10' } });
    fireEvent.change(siglaInput, { target: { value: 'uo60' } });
    fireEvent.change(nomeInput, { target: { value: 'unidade orcamentaria 60' } });
    fireEvent.change(siglaOrgaoInput, { target: { value: 'sme' } });
    fireEvent.change(codigoOrgaoInput, { target: { value: '1010' } });
    fireEvent.change(orgaoInput, { target: { value: 'secretaria externa 60' } });

    expect(codigoInput).toHaveValue('AA-01.16.10');
    expect(siglaInput).toHaveValue('UO60');
    expect(nomeInput).toHaveValue('UNIDADE ORCAMENTARIA 60');
    expect(siglaOrgaoInput).toHaveValue('SME');
    expect(codigoOrgaoInput).toHaveValue('10.10');
    expect(orgaoInput).toHaveValue('SECRETARIA EXTERNA 60');
  });

  it('desabilita os campos editáveis quando está submetendo', () => {
    renderForm({ submitting: true });

    expect(screen.getByPlaceholderText('Informe o código da UO')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByPlaceholderText('Informe a sigla da UO')).toBeDisabled();
    expect(screen.getByPlaceholderText('Informe o nome da UO')).toBeDisabled();
    expect(screen.getByPlaceholderText('Informe a sigla do órgão')).toBeDisabled();
    expect(screen.getByPlaceholderText('Informe o código do órgão')).toBeDisabled();
    expect(screen.getByPlaceholderText('Informe o nome do órgão')).toBeDisabled();
  });
});