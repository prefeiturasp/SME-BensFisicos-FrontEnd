import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExcluirParametroModal } from '../components/ExcluirParametroModal';
import { ParametroConciliacaoForm } from '../components/ParametroConciliacaoForm';
import { ParametrosConciliacaoBreadcrumb } from '../components/ParametrosConciliacaoBreadcrumb';
import {
  useParametroConciliacaoAnualById,
  useParametroConciliacaoAnualDelete,
  useParametroConciliacaoAnualUpdate,
} from '../hooks/useParametrosConciliacaoAnual';
import { parametrosConciliacaoAnualService } from '../services/parametros-conciliacao-anual.service';
import type {
  ParametroConciliacaoAnual,
  ParametroConciliacaoPayload,
} from '../types/parametros-conciliacao-anual.types';
import {
  parametroConciliacaoAnualSchema,
  type ParametroConciliacaoAnualFormData,
} from '../validators/parametro-conciliacao-anual.schema';
import { canAccessParametrosConciliacao } from '../utils/permissions';

const OUTLINE_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const SAVE_BUTTON_CLASS = 'h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md';
const DANGER_BUTTON_CLASS = 'h-10 px-6 bg-[#C20F06] text-white hover:bg-[#A70C05] rounded-md';

type PageMode = 'create' | 'view' | 'edit';

interface FormActionsProps {
  mode: PageMode;
  submitting: boolean;
  updating: boolean;
  deleting: boolean;
  isSaveDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function getPageMode(id: string | undefined, pathname: string): PageMode {
  if (!id) {
    return 'create';
  }

  if (pathname.endsWith('/editar')) {
    return 'edit';
  }

  return 'view';
}

function getPageTitle(mode: PageMode) {
  const titles = {
    create: 'Adicionar Par\u00e2metro de Concilia\u00e7\u00e3o Anual',
    edit: 'Editar Par\u00e2metro de Concilia\u00e7\u00e3o Anual',
    view: 'Visualizar Par\u00e2metro de Concilia\u00e7\u00e3o Anual',
  };

  return titles[mode];
}

function getParametroQueryId(
  mode: PageMode,
  hasValidId: boolean,
  canManage: boolean,
  parametroId: number | null,
) {
  if (mode === 'create' || !hasValidId || !canManage) {
    return null;
  }

  return parametroId;
}

function FormActions({
  mode,
  submitting,
  updating,
  deleting,
  isSaveDisabled,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: Readonly<FormActionsProps>) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  return (
    <div className='flex flex-wrap items-center justify-end gap-3'>
      {isView && (
        <Button type='button' className={OUTLINE_BUTTON_CLASS} onClick={onEdit}>
          Editar
        </Button>
      )}

      {isEdit && (
        <Button
          type='button'
          className={DANGER_BUTTON_CLASS}
          disabled={submitting || deleting}
          onClick={onDelete}
        >
          Excluir
        </Button>
      )}

      {!isView && (
        <Button type='button' className={SAVE_BUTTON_CLASS} disabled={isSaveDisabled} onClick={onSave}>
          {submitting || updating ? 'Salvando...' : 'Salvar'}
        </Button>
      )}

      <Button type='button' onClick={onCancel} className={OUTLINE_BUTTON_CLASS}>
        Cancelar
      </Button>
    </div>
  );
}

function mapBadRequestToForm(
  error: unknown,
  form: UseFormReturn<ParametroConciliacaoAnualFormData>,
) {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) {
    return false;
  }

  const data = error.response.data ?? {};
  const messages = [
    ...(Array.isArray(data.non_field_errors) ? data.non_field_errors : []),
    ...(Array.isArray(data.periodo_final) ? data.periodo_final : []),
    ...(Array.isArray(data.ano_referencia) ? data.ano_referencia : []),
    ...(Array.isArray(data.ativo) ? data.ativo : []),
  ].map(String);

  const text = messages.join(' ');

  if (/sobrep/i.test(text)) {
    form.setError('periodoInicial', {
      message: 'Data inicial em que conciliações anuais podem ser criadas/fechadas.',
    });
    form.setError('periodoFinal', {
      message: 'Data final em que conciliações anuais podem ser criadas/fechadas.',
    });
    toast.error('Não foi possível cadastrar o parâmetro.', {
      description:
        'Já existe um período cadastrado que se sobrepõe ao intervalo informado. Revise as datas e tente novamente.',
    });
    return true;
  }

  if (/ativo/i.test(text)) {
    form.setError('ativo', {
      message: 'Apenas um parâmetro ativo por ano.',
    });
    toast.error('Não foi possível cadastrar o parâmetro.', {
      description:
        'Já existe um parâmetro ativo para o ano selecionado. Desative o parâmetro vigente antes de cadastrar um novo.',
    });
    return true;
  }

  if (/ano/i.test(text)) {
    form.setError('anoReferencia', {
      message: 'Ano da conciliação anual ao qual este parâmetro se refere.',
    });
    toast.error('Não foi possível cadastrar o parâmetro.', {
      description: 'Já existe um parâmetro para o ano selecionado. Revise o ano e tente novamente.',
    });
    return true;
  }

  const fallback = messages[0] || 'Revise os dados e tente novamente.';
  form.setError('root.serverError', { type: 'server', message: fallback });
  toast.error('Não foi possível cadastrar o parâmetro.', { description: fallback });
  return true;
}

function buildPayload(
  values: ParametroConciliacaoAnualFormData,
  unidadeOrcamentariaId: number,
): ParametroConciliacaoPayload {
  return {
    unidade_orcamentaria: unidadeOrcamentariaId,
    ano_referencia: Number(values.anoReferencia),
    periodo_inicial: displayDateToIso(values.periodoInicial),
    periodo_final: displayDateToIso(values.periodoFinal),
    ativo: values.ativo,
  };
}

function displayDateToIso(value: string) {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

function isoDateToDisplay(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function getParametroLabel(parametro: ParametroConciliacaoAnual) {
  return `${parametro.unidade_orcamentaria_codigo} - ${parametro.unidade_orcamentaria_nome}`;
}

export default function ParametroConciliacaoAnualFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const parametroId = id ? Number(id) : null;
  const pageMode = getPageMode(id, location.pathname);
  const isCreate = pageMode === 'create';
  const isEdit = pageMode === 'edit';
  const isView = pageMode === 'view';
  const hasValidId =
    pageMode === 'create' || (Number.isInteger(parametroId) && Number(parametroId) > 0);
  const canManage = canAccessParametrosConciliacao(user);
  const pageTitle = getPageTitle(pageMode);

  const parametroQuery = useParametroConciliacaoAnualById(
    getParametroQueryId(pageMode, hasValidId, canManage, parametroId),
  );
  const updateMutation = useParametroConciliacaoAnualUpdate();
  const deleteMutation = useParametroConciliacaoAnualDelete();

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

  const uoAtiva = user?.uo_ativa;
  const parametro = parametroQuery.data;
  const unidadeOrcamentariaId = parametro?.unidade_orcamentaria ?? uoAtiva?.id;
  const unidadeOrcamentariaLabel = useMemo(() => {
    if (parametro) return getParametroLabel(parametro);
    if (uoAtiva) return `${uoAtiva.codigo} - ${uoAtiva.nome}`;
    return 'Unidade Orçamentária não disponível';
  }, [parametro, uoAtiva]);

  useEffect(() => {
    if (!parametro) return;

    form.reset({
      anoReferencia: String(parametro.ano_referencia),
      periodoInicial: isoDateToDisplay(parametro.periodo_inicial),
      periodoFinal: isoDateToDisplay(parametro.periodo_final),
      ativo: parametro.ativo,
    });
  }, [form, parametro]);

  const handleCancel = () => navigate('/parametros-conciliacao-anual');
  const handleEdit = () => {
    if (parametro) {
      navigate(`/parametros-conciliacao-anual/${parametro.id}/editar`);
    }
  };

  const handleSubmit = async (values: ParametroConciliacaoAnualFormData) => {
    form.clearErrors('root.serverError');

    if (!unidadeOrcamentariaId) {
      const message = 'Não foi possível identificar a Unidade Orçamentária do seu escopo.';
      form.setError('root.serverError', { message });
      toast.error(message);
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload(values, unidadeOrcamentariaId);

      if (isEdit && parametro) {
        await updateMutation.mutateAsync({ id: parametro.id, payload });
      } else {
        await parametrosConciliacaoAnualService.create(payload);
      }

      toast.success('Cadastro realizado com sucesso!', {
        description:
          'O Parâmetro de Conciliação Anual foi salvo e já está disponível na listagem.',
      });
      navigate('/parametros-conciliacao-anual');
    } catch (error) {
      if (mapBadRequestToForm(error, form)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Não foi possível cadastrar o parâmetro.';
      form.setError('root.serverError', { type: 'server', message });
      toast.error('Não foi possível cadastrar o parâmetro.', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!parametro) return;

    try {
      await deleteMutation.mutateAsync(parametro.id);
      setShowDeleteModal(false);
      toast.success('Parâmetro excluído com sucesso!', {
        description: 'O parâmetro foi removido e não estará mais disponível na listagem.',
      });
      navigate('/parametros-conciliacao-anual');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível excluir o parâmetro.';
      toast.error('Não foi possível excluir o parâmetro.', { description: message });
    }
  };

  if (!hasValidId) {
    return (
      <div className='space-y-4 p-8'>
        <ParametrosConciliacaoBreadcrumb current={pageTitle} />
        <Card className='p-6 text-sm text-red-700'>Identificador do parâmetro inválido.</Card>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className='space-y-4 p-8'>
        <ParametrosConciliacaoBreadcrumb current={pageTitle} />
        <Card className='p-6 text-sm text-red-700'>
          {'Voc\u00ea n\u00e3o tem permiss\u00e3o para acessar Par\u00e2metros de Concilia\u00e7\u00e3o Anual.'}
        </Card>
      </div>
    );
  }

  if (!isCreate && parametroQuery.isLoading) {
    return (
      <div className='p-8 flex items-center justify-center'>
        <span className='text-sm text-gray-500'>Carregando parâmetro de conciliação anual...</span>
      </div>
    );
  }

  if (!isCreate && (parametroQuery.isError || !parametro)) {
    return (
      <div className='space-y-4 p-8'>
        <ParametrosConciliacaoBreadcrumb current={pageTitle} />
        <Card className='p-6 text-sm text-red-700'>
          Não foi possível carregar o parâmetro de conciliação anual.
        </Card>
      </div>
    );
  }

  const isSaveDisabled =
    !unidadeOrcamentariaId ||
    submitting ||
    updateMutation.isPending ||
    !form.formState.isValid ||
    (isEdit && !form.formState.isDirty);

  return (
    <div className='space-y-4 p-8' data-testid='parametro-conciliacao-form'>
      <ParametrosConciliacaoBreadcrumb current={pageTitle} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          {pageTitle}
        </h1>

        <FormActions
          mode={pageMode}
          submitting={submitting}
          updating={updateMutation.isPending}
          deleting={deleteMutation.isPending}
          isSaveDisabled={isSaveDisabled}
          onEdit={handleEdit}
          onDelete={() => setShowDeleteModal(true)}
          onSave={form.handleSubmit(handleSubmit)}
          onCancel={handleCancel}
        />
      </div>

      <Card className='min-h-[520px] p-8'>
        <ParametroConciliacaoForm
          form={form}
          unidadeOrcamentariaLabel={unidadeOrcamentariaLabel}
          submitting={submitting || updateMutation.isPending}
          disabled={isView}
          onSubmit={handleSubmit}
        />
      </Card>

      {showDeleteModal && parametro && (
        <ExcluirParametroModal
          parametro={parametro}
          deleting={deleteMutation.isPending}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
