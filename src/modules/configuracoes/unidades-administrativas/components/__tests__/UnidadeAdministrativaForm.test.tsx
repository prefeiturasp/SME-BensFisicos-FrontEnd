import { render, screen, waitFor } from '@testing-library/react';
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

describe('UnidadeAdministrativaForm', () => {
  it('exibe Inativa quando o status chega por reset', async () => {
    render(<StatusResetForm nextStatus='inativa' />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Inativa');
    });
  });
});
