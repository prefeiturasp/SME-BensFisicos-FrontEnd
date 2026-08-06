import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DadosBem } from '../components/DadosBem';
import { ModalExclusao } from '../components/ModalExclusao';
import { OcorrenciaBreadcrumb } from '../components/OcorrenciaBreadcrumb';
import { OcorrenciaForm } from '../components/OcorrenciaForm';
import {
  useConciliacaoItem,
  useConciliacaoItemSituacoesDisponiveis,
  useConciliacaoOcorrenciaRemover,
  useConciliacaoOcorrenciaUpsert,
} from '../hooks/useConciliacoes';
import { canAccessConciliacoes } from '../utils/permissions';
import {
  ocorrenciaFormSchema,
  type OcorrenciaFormData,
} from '../validators/ocorrencia-form.schema';
import type { ConciliacaoItemSituacao } from '../types/conciliacoes.types';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const DANGER_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold rounded-md transition-colors';

const SAVE_BUTTON_CLASS = 'h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md';

const FALLBACK_ERROR_MESSAGE = 'Não foi possível registrar a ocorrência.';

function extractMessage(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return null;
}

function isValidationError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 400;
}

export default function RegistarOcorrenciaPage() {
  const { user } = useAuth();
  const canAccess = canAccessConciliacoes(user);

  if (!canAccess) {
    return (
      <div className='space-y-4 p-8' data-testid='registrar-ocorrencia-page'>
        <OcorrenciaBreadcrumb conciliacaoId={0} itemId={0} />
        <Card className='p-6 text-sm text-red-700'>
          Você não tem permissão para registrar ocorrências em Conciliações.
        </Card>
      </div>
    );
  }

  return <RegistarOcorrenciaContent />;
}

function RegistarOcorrenciaContent() {
  const navigate = useNavigate();
  const params = useParams<{ id: string; itemId: string }>();

  const conciliacaoId = Number(params.id);
  const itemId = Number(params.itemId);
  const hasValidId =
    Number.isInteger(conciliacaoId) &&
    conciliacaoId > 0 &&
    Number.isInteger(itemId) &&
    itemId > 0;

  const itemQuery = useConciliacaoItem(
    hasValidId ? conciliacaoId : null,
    hasValidId ? itemId : null,
  );

  const opcoesQuery = useConciliacaoItemSituacoesDisponiveis(
    hasValidId ? conciliacaoId : null,
    hasValidId ? itemId : null,
  );

  const upsertMutation = useConciliacaoOcorrenciaUpsert();
  const removerMutation = useConciliacaoOcorrenciaRemover();

  const [showExclusao, setShowExclusao] = useState(false);
  const [removerError, setRemoverError] = useState<string | null>(null);

  const item = itemQuery.data;
  const ocorrenciaAtual = useMemo(
    () => (item?.ocorrencias && item.ocorrencias.length > 0 ? item.ocorrencias[0] : null),
    [item?.ocorrencias],
  );

  const form = useForm<OcorrenciaFormData>({
    resolver: zodResolver(ocorrenciaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      situacao: '',
      divergencia: '',
      observacao: '',
    },
  });

  useEffect(() => {
    if (!item) return;
    form.reset(
      {
        situacao: ocorrenciaAtual?.situacao ?? '',
        divergencia: ocorrenciaAtual?.divergencia ?? '',
        observacao: ocorrenciaAtual?.observacao ?? '',
      },
      { keepDefaultValues: false },
    );
  }, [form, item, ocorrenciaAtual]);

  const watchedSituacao = useWatch({ control: form.control, name: 'situacao' });
  const watchedDivergencia = useWatch({
    control: form.control,
    name: 'divergencia',
  });

  const isFormComplete = useMemo(() => {
    if (!watchedSituacao) return false;
    if (watchedSituacao === 'divergente') {
      return Boolean(
        watchedDivergencia && watchedDivergencia.trim().length > 0,
      );
    }
    return true;
  }, [watchedDivergencia, watchedSituacao]);

  const showErrorToast = useCallback((description: string) => {
    toast.error(FALLBACK_ERROR_MESSAGE, { description });
  }, []);

  const setServerError = useCallback(
    (message: string) => {
      form.clearErrors('root.serverError');
      form.setError('root.serverError', { type: 'server', message });
    },
    [form],
  );

  const handleSalvar = form.handleSubmit(async (values) => {
    if (!hasValidId) return;

    form.clearErrors('root.serverError');

    const payload =
      values.situacao === 'divergente'
        ? {
            situacao: values.situacao as ConciliacaoItemSituacao,
            divergencia: values.divergencia?.trim() ?? '',
            observacao: '',
          }
        : {
            situacao: values.situacao as ConciliacaoItemSituacao,
            observacao: values.observacao?.trim() ?? '',
            divergencia: '',
          };

    try {
      await upsertMutation.mutateAsync({
        conciliacaoId,
        itemId,
        payload,
      });
      toast.success('Ocorrência registrada com sucesso.', {
        description: 'A situação do bem foi atualizada e a conciliação refletirá a mudança.',
      });
      navigate(`/conciliacoes/${conciliacaoId}`);
    } catch (error) {
      if (isValidationError(error)) {
        const axiosError = error as AxiosError;
        const data = axiosError.response?.data;
        if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>;
          const divergenciaMsg = extractMessage(obj.divergencia);
          if (divergenciaMsg) {
            form.setError('divergencia', { type: 'server', message: divergenciaMsg });
            showErrorToast(divergenciaMsg);
            return;
          }
          const detail = extractMessage(obj.detail);
          if (detail) {
            setServerError(detail);
            showErrorToast(detail);
            return;
          }
        }
      }

      const message = error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE;
      setServerError(message);
      showErrorToast(message);
    }
  });

  const handleCancelar = () => {
    if (upsertMutation.isPending || removerMutation.isPending) return;
    navigate(`/conciliacoes/${conciliacaoId}`);
  };

  const handleExcluir = () => {
    setRemoverError(null);
    setShowExclusao(true);
  };

  const handleCloseExclusao = () => {
    if (removerMutation.isPending) return;
    setShowExclusao(false);
    setRemoverError(null);
  };

  const handleConfirmarExclusao = async () => {
    if (!hasValidId) return;
    setRemoverError(null);
    try {
      await removerMutation.mutateAsync({ conciliacaoId, itemId });
      toast.success('Ocorrência excluída com sucesso.');
      setShowExclusao(false);
      navigate(`/conciliacoes/${conciliacaoId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao excluir a ocorrência.';
      setRemoverError(message);
      showErrorToast(message);
    }
  };

  if (!hasValidId) {
    return (
      <div className='space-y-4 p-8' data-testid='registrar-ocorrencia-page'>
        <OcorrenciaBreadcrumb conciliacaoId={0} itemId={0} />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Registrar Ocorrência
          </h1>
          <Button
            type='button'
            onClick={() => navigate('/conciliacoes')}
            className={ACTION_BUTTON_CLASS}
          >
            Cancelar
          </Button>
        </div>

        <Card className='p-6 text-sm text-red-700'>
          Identificadores da Conciliação ou do Item inválidos.
        </Card>
      </div>
    );
  }

  if (itemQuery.isLoading || opcoesQuery.isLoading) {
    return (
      <div
        className='flex items-center justify-center p-8'
        data-testid='registrar-ocorrencia-page'
      >
        <span className='text-sm text-gray-500'>Carregando dados do bem...</span>
      </div>
    );
  }

  if (itemQuery.isError || !item) {
    const message =
      itemQuery.error instanceof Error
        ? itemQuery.error.message
        : 'Não foi possível carregar o item da conciliação.';
    return (
      <div className='space-y-4 p-8' data-testid='registrar-ocorrencia-page'>
        <OcorrenciaBreadcrumb conciliacaoId={conciliacaoId} itemId={itemId} />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Registrar Ocorrência
          </h1>
          <Button
            type='button'
            onClick={() => navigate(`/conciliacoes/${conciliacaoId}`)}
            className={ACTION_BUTTON_CLASS}
          >
            Cancelar
          </Button>
        </div>

        <Card className='p-6 text-sm text-red-700'>{message}</Card>
      </div>
    );
  }

  const opcoes = opcoesQuery.data ?? [];
  const opcoesDisabled = upsertMutation.isPending;
  const salvarDisabled = upsertMutation.isPending || !isFormComplete;
  const temOcorrencia = item.tem_ocorrencia;
  const mostrarMensagemCondicional = !temOcorrencia;

  return (
    <div className='space-y-4 p-8' data-testid='registrar-ocorrencia-page'>
      <OcorrenciaBreadcrumb conciliacaoId={conciliacaoId} itemId={itemId} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Registrar Ocorrência
        </h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          {temOcorrencia && (
            <Button
              type='button'
              onClick={handleExcluir}
              className={DANGER_BUTTON_CLASS}
              disabled={removerMutation.isPending}
              data-testid='registrar-ocorrencia-excluir'
            >
              Excluir
            </Button>
          )}

          <Button
            type='button'
            onClick={handleSalvar}
            className={SAVE_BUTTON_CLASS}
            disabled={salvarDisabled}
            data-testid='registrar-ocorrencia-salvar'
          >
            {upsertMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>

          <Button
            type='button'
            onClick={handleCancelar}
            className={ACTION_BUTTON_CLASS}
            disabled={upsertMutation.isPending}
            data-testid='registrar-ocorrencia-cancelar'
          >
            Cancelar
          </Button>
        </div>
      </div>

      <Card className='p-6'>
        <DadosBem
          numeroPatrimonial={item.bem.numero_patrimonial}
          nome={item.bem.nome}
          situacao={item.situacao}
          observacao={item.observacao}
          divergencia={item.divergencia}
          bem={item.bem}
        />
      </Card>

      <Card className='p-6'>
        <div className='space-y-5'>
          <h3 className='text-base font-bold text-[#2F7D57]'>Registro da ocorrência</h3>

          {opcoesQuery.isError ? (
            <Card className='border-red-200 bg-red-50 p-4 text-sm text-red-700'>
              Não foi possível carregar as situações disponíveis para este item.
            </Card>
          ) : opcoes.length === 0 ? (
            <Card className='p-4 text-sm text-gray-500'>
              Nenhuma situação disponível para este item.
            </Card>
          ) : (
            <OcorrenciaForm
              form={form}
              opcoes={opcoes}
              situacaoAnterior={item.situacao}
              mostrarMensagemCondicional={mostrarMensagemCondicional}
              disabled={opcoesDisabled}
            />
          )}
        </div>
      </Card>

      <ModalExclusao
        open={showExclusao}
        loading={removerMutation.isPending}
        errorMessage={removerError}
        onConfirm={handleConfirmarExclusao}
        onClose={handleCloseExclusao}
      />
    </div>
  );
}
