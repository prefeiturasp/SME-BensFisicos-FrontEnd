import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConciliacaoCreateBreadcrumb } from '../components/ConciliacaoCreateBreadcrumb';
import { ConciliacaoForm } from '../components/ConciliacaoForm';
import { useConciliacaoCreate } from '../hooks/useConciliacoes';
import {
  CONCILIACAO_ERROR_TOAST_TITLE,
  handleConciliacaoBadRequestError,
} from '../utils/form-error-handler';
import {
  conciliacaoFormSchema,
  type ConciliacaoFormData,
} from '../validators/conciliacao-form.schema';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const SAVE_BUTTON_CLASS = 'h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md';

const TIPO_CONCILIACAO = 'Eventual';

const FALLBACK_ERROR_MESSAGE = 'Tente novamente em alguns instantes.';

function displayDateToIso(value: string) {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

function buildUnidadeAdministrativaLabel(codigo?: string, nome?: string) {
  if (!codigo) {
    return 'Unidade Administrativa não disponível';
  }

  if (!nome) {
    return codigo;
  }

  return `${codigo} - ${nome}`;
}

export default function AdicionarConciliacaoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createConciliacao = useConciliacaoCreate();

  const form = useForm<ConciliacaoFormData>({
    resolver: zodResolver(conciliacaoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      periodoFinal: '',
    },
  });

  const uaAtiva = user?.ua_ativa;
  const unidadeAdministrativaId = uaAtiva?.id ?? null;
  const unidadeAdministrativaLabel = useMemo(
    () => buildUnidadeAdministrativaLabel(uaAtiva?.codigo, uaAtiva?.nome),
    [uaAtiva?.codigo, uaAtiva?.nome],
  );

  const periodoFinalValue = useWatch({ control: form.control, name: 'periodoFinal' });
  const isPeriodoFinalFilled = conciliacaoFormSchema.shape.periodoFinal.safeParse(
    periodoFinalValue ?? '',
  ).success;

  const isUaUnavailable = !unidadeAdministrativaId;
  const isSaveDisabled = isUaUnavailable || createConciliacao.isPending || !isPeriodoFinalFilled;

  const showErrorToast = (description: string) => {
    toast.error(CONCILIACAO_ERROR_TOAST_TITLE, { description });
  };

  const handleSubmit = async (values: ConciliacaoFormData) => {
    form.clearErrors('root.serverError');

    if (!unidadeAdministrativaId) {
      const message = 'Não foi possível identificar a Unidade Administrativa do seu escopo.';
      form.setError('root.serverError', { type: 'server', message });
      showErrorToast(message);
      return;
    }

    try {
      await createConciliacao.mutateAsync({
        unidade_administrativa: unidadeAdministrativaId,
        periodo_final: displayDateToIso(values.periodoFinal),
      });

      toast.success('Cadastro realizado com sucesso!', {
        description: 'A Conciliação foi adicionada com sucesso e já está disponível na listagem.',
      });

      navigate('/conciliacoes');
    } catch (error) {
      const result = handleConciliacaoBadRequestError(error, form);
      if (result.handled) {
        showErrorToast(result.toastDescription);
        return;
      }

      if (error instanceof AxiosError && error.response?.status === 400) {
        form.setError('root.serverError', { type: 'server', message: FALLBACK_ERROR_MESSAGE });
        showErrorToast(FALLBACK_ERROR_MESSAGE);
        return;
      }

      const message = error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE;
      form.setError('root.serverError', { type: 'server', message });
      showErrorToast(message);
    }
  };

  return (
    <div className='space-y-4 p-8' data-testid='adicionar-conciliacao-page'>
      <ConciliacaoCreateBreadcrumb />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>Adicionar Conciliação</h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            className={SAVE_BUTTON_CLASS}
            disabled={isSaveDisabled}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {createConciliacao.isPending ? 'Salvando...' : 'Salvar'}
          </Button>

          <Button
            type='button'
            onClick={() => navigate('/conciliacoes')}
            className={ACTION_BUTTON_CLASS}
            disabled={createConciliacao.isPending}
          >
            Cancelar
          </Button>
        </div>
      </div>

      <Card className='p-6'>
        <ConciliacaoForm
          form={form}
          unidadeAdministrativaLabel={unidadeAdministrativaLabel}
          tipoConciliacaoLabel={TIPO_CONCILIACAO}
          submitting={createConciliacao.isPending}
          disabled={isUaUnavailable}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}
