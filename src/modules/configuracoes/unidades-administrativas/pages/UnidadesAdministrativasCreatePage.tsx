import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnidadeAdministrativaForm } from '../components/UnidadeAdministrativaForm';
import { UnidadesAdministrativasCreateBreadcrumb } from '../components/UnidadesAdministrativasCreateBreadcrumb';
import { unidadesAdministrativasService } from '../services/unidades-administrativas.service';
import {
  unidadeAdministrativaFormSchema,
  type UnidadeAdministrativaFormData,
} from '../validators/unidade-administrativa-form.schema';
import { handleUnidadeAdministrativaBadRequestError } from '../utils/form-error-handler';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

export default function UnidadesAdministrativasCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<UnidadeAdministrativaFormData>({
    resolver: zodResolver(unidadeAdministrativaFormSchema),
    defaultValues: {
      codigoFinal: '',
      sigla: '',
      nome: '',
      status: 'ativa',
    },
  });

  const uoAtiva = user?.uo_ativa;
  const uoCodigo = uoAtiva?.codigo ?? '---';
  const uoNome = uoAtiva?.nome ?? '';

  const isUoUnavailable = useMemo(() => !uoAtiva?.id || !uoAtiva?.codigo, [uoAtiva]);

  const handleSubmit = async (values: UnidadeAdministrativaFormData) => {
    form.clearErrors('root.serverError');

    if (!uoAtiva?.id) {
      const message = 'Não foi possível identificar a Unidade Orçamentária do seu escopo.';
      form.setError('root.serverError', { message });
      toast.error(message);
      return;
    }

    setSubmitting(true);

    try {
      await unidadesAdministrativasService.create({
        unidade_orcamentaria: uoAtiva.id,
        codigo: `${uoAtiva.codigo}.${values.codigoFinal}`,
        sigla: values.sigla.trim().toUpperCase(),
        nome: values.nome.trim(),
        status: values.status,
      });

      toast.success('Cadastro realizado com sucesso!', {
        description: 'A Unidade Administrativa foi cadastrada.',
      });

      navigate('/unidades-administrativas');
    } catch (error) {
      if (
        handleUnidadeAdministrativaBadRequestError(error, form, {
          includeUnidadeOrcamentariaError: true,
        })
      ) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Erro ao cadastrar unidade administrativa.';
      form.setError('root.serverError', { type: 'server', message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-4 p-8'>
      <UnidadesAdministrativasCreateBreadcrumb />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Adicionar Unidade Administrativa
        </h1>

        <div className='flex items-center justify-end gap-3'>
          <Button
            type='button'
            className='h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md'
            disabled={isUoUnavailable || submitting}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>

          <Button
            type='button'
            onClick={() => navigate('/unidades-administrativas')}
            className={ACTION_BUTTON_CLASS}
          >
            Cancelar
          </Button>
        </div>
      </div>

      <Card className='p-6'>
        <UnidadeAdministrativaForm
          form={form}
          uoCodigo={uoCodigo}
          uoNome={uoNome}
          submitting={submitting}
          disabled={isUoUnavailable}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}
