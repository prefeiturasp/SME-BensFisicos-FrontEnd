import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnidadeOrcamentariaForm } from '../components/UnidadeOrcamentariaForm';
import { UnidadesOrcamentariasViewBreadcrumb } from '../components/UnidadesOrcamentariasViewBreadcrumb';
import { UnidadesOrcamentariasGuard } from '../components/UnidadesOrcamentariasGuard';
import {
  useUnidadeOrcamentariaById,
  useUnidadeOrcamentariaUpdate,
} from '../hooks/useUnidadeOrcamentaria';
import type {
  UnidadeOrcamentaria,
  UpdateUnidadeOrcamentariaPayload,
} from '../types/unidades-orcamentarias.types';
import { handleUnidadeOrcamentariaBadRequestError } from '../utils/form-error-handler';
import {
  unidadeOrcamentariaFormSchema,
  type UnidadeOrcamentariaFormData,
} from '../validators/unidade-orcamentaria-form.schema';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const PRIMARY_SAVE_BUTTON_CLASS =
  'h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md';

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function normalizeUppercaseText(value: string | null | undefined) {
  return normalizeText(value).toUpperCase();
}

function buildUpdatePayload(
  unidade: UnidadeOrcamentaria,
  values: UnidadeOrcamentariaFormData,
): UpdateUnidadeOrcamentariaPayload {
  const nextCodigo = normalizeText(values.codigo);
  const nextSigla = normalizeUppercaseText(values.sigla);
  const nextNome = normalizeUppercaseText(values.nome);
  const nextSiglaOrgao = normalizeUppercaseText(values.sigla_orgao);
  const nextOrgao = normalizeUppercaseText(values.orgao);
  const nextCodigoOrgao = normalizeText(values.codigo_orgao);
  const nextAtiva = values.status === 'ativa';

  const currentSigla = normalizeUppercaseText(unidade.sigla);
  const currentNome = normalizeUppercaseText(unidade.nome);
  const currentSiglaOrgao = normalizeUppercaseText(unidade.sigla_orgao);
  const currentOrgao = normalizeUppercaseText(unidade.orgao);
  const currentCodigoOrgao = normalizeText(unidade.codigo_orgao);

  const payload: UpdateUnidadeOrcamentariaPayload = {};

  if (nextCodigo !== normalizeText(unidade.codigo)) {
    payload.codigo = nextCodigo;
  }

  if (nextSigla !== currentSigla) {
    payload.sigla = nextSigla;
  }

  if (nextNome !== currentNome) {
    payload.nome = nextNome;
  }

  if (nextSiglaOrgao !== currentSiglaOrgao) {
    payload.sigla_orgao = nextSiglaOrgao;
  }

  if (nextOrgao !== currentOrgao) {
    payload.orgao = nextOrgao;
  }

  if (nextCodigoOrgao !== currentCodigoOrgao) {
    payload.codigo_orgao = nextCodigoOrgao;
  }

  if (nextAtiva !== unidade.ativa) {
    payload.ativa = nextAtiva;
  }

  return payload;
}

function getPrimaryActionLabel(isEditing: boolean, isPending: boolean) {
  if (!isEditing) {
    return 'Editar';
  }

  return isPending ? 'Salvando...' : 'Salvar';
}

export default function UnidadesOrcamentariasViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);

  const unidadeId = Number(id);
  const hasValidId = Number.isInteger(unidadeId) && unidadeId > 0;

  const unidadeQuery = useUnidadeOrcamentariaById(hasValidId ? unidadeId : null);
  const updateMutation = useUnidadeOrcamentariaUpdate();

  const form = useForm<UnidadeOrcamentariaFormData>({
    resolver: zodResolver(unidadeOrcamentariaFormSchema),
    defaultValues: {
      codigo: '',
      sigla: '',
      nome: '',
      sigla_orgao: '',
      orgao: '',
      codigo_orgao: '',
      status: 'ativa',
    },
  });

  const unidade = unidadeQuery.data;

  useEffect(() => {
    if (!unidade) {
      return;
    }

    form.reset({
      codigo: unidade.codigo,
      sigla: unidade.sigla,
      nome: unidade.nome,
      sigla_orgao: unidade.sigla_orgao,
      orgao: unidade.orgao,
      codigo_orgao: unidade.codigo_orgao,
      status: unidade.ativa ? 'ativa' : 'inativa',
    });
  }, [form, unidade]);

  const handleCancel = () => {
    navigate('/unidades-orcamentarias');
  };

  const handleSave = async (values: UnidadeOrcamentariaFormData) => {
    if (!unidade) return;

    form.clearErrors('root.serverError');

    try {
      const payload = buildUpdatePayload(unidade, values);

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      await updateMutation.mutateAsync({
        id: unidade.id,
        payload,
      });

      toast.success('Unidade Orçamentária atualizada com sucesso.');
      navigate('/unidades-orcamentarias');
    } catch (error) {
      if (handleUnidadeOrcamentariaBadRequestError(error, form)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar unidade orçamentária.';

      form.setError('root.serverError', { type: 'server', message });
      toast.error(message);
    }
  };

  const handlePrimaryAction = () => {
    if (!isEditing) {
      form.clearErrors('root.serverError');
      setIsEditing(true);
      return;
    }

    void form.handleSubmit(handleSave)();
  };

  if (!hasValidId) {
    return (
      <UnidadesOrcamentariasGuard>
        <div className='space-y-4 p-8' data-testid='unidades-orcamentarias-view'>
          <UnidadesOrcamentariasViewBreadcrumb isEditing={false} />

          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <h1 className='text-xl font-bold tracking-tight text-gray-700'>
              Visualizar Unidade Orçamentária
            </h1>

            <Button type='button' onClick={handleCancel} className={ACTION_BUTTON_CLASS}>
              Cancelar
            </Button>
          </div>

          <Card className='space-y-3 p-6'>
            <p className='text-sm text-red-700'>Identificador da Unidade Orçamentária inválido.</p>
          </Card>
        </div>
      </UnidadesOrcamentariasGuard>
    );
  }

  if (unidadeQuery.isLoading) {
    return (
      <UnidadesOrcamentariasGuard>
        <div className='flex items-center justify-center p-8'>
          <span className='text-sm text-gray-500'>Carregando detalhes da unidade orçamentária...</span>
        </div>
      </UnidadesOrcamentariasGuard>
    );
  }

  if (unidadeQuery.isError || !unidade) {
    const message =
      unidadeQuery.error instanceof Error
        ? unidadeQuery.error.message
        : 'Não foi possível carregar a unidade orçamentária.';

    return (
      <UnidadesOrcamentariasGuard>
        <div className='space-y-4 p-8' data-testid='unidades-orcamentarias-view'>
          <UnidadesOrcamentariasViewBreadcrumb isEditing={false} />

          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <h1 className='text-xl font-bold tracking-tight text-gray-700'>
              Visualizar Unidade Orçamentária
            </h1>

            <Button type='button' onClick={handleCancel} className={ACTION_BUTTON_CLASS}>
              Cancelar
            </Button>
          </div>

          <Card className='space-y-3 p-6'>
            <p className='text-sm text-red-700'>{message}</p>
          </Card>
        </div>
      </UnidadesOrcamentariasGuard>
    );
  }

  const primaryActionLabel = getPrimaryActionLabel(isEditing, updateMutation.isPending);

  return (
    <UnidadesOrcamentariasGuard>
      <div className='space-y-4 p-8' data-testid='unidades-orcamentarias-view'>
        <UnidadesOrcamentariasViewBreadcrumb isEditing={isEditing} />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            {isEditing ? 'Editar Unidade Orçamentária' : 'Visualizar Unidade Orçamentária'}
          </h1>

          <div className='flex items-center justify-end gap-3'>
            <Button
              type='button'
              className={isEditing ? PRIMARY_SAVE_BUTTON_CLASS : ACTION_BUTTON_CLASS}
              disabled={updateMutation.isPending}
              onClick={handlePrimaryAction}
            >
              {primaryActionLabel}
            </Button>

            <Button type='button' onClick={handleCancel} className={ACTION_BUTTON_CLASS}>
              Cancelar
            </Button>
          </div>
        </div>

        <Card className='p-6'>
          <UnidadeOrcamentariaForm
            form={form}
            submitting={updateMutation.isPending}
            disabled={!isEditing}
            onSubmit={handleSave}
          />
        </Card>
      </div>
    </UnidadesOrcamentariasGuard>
  );
}