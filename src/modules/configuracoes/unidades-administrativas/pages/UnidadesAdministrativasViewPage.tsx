import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnidadeAdministrativaForm } from '../components/UnidadeAdministrativaForm';
import { UnidadesAdministrativasViewBreadcrumb } from '../components/UnidadesAdministrativasViewBreadcrumb';
import {
  useUnidadeAdministrativaById,
  useUnidadeAdministrativaUpdate,
} from '../hooks/useUnidadeAdministrativa';
import {
  unidadeAdministrativaFormSchema,
  type UnidadeAdministrativaFormData,
} from '../validators/unidade-administrativa-form.schema';
import { handleUnidadeAdministrativaBadRequestError } from '../utils/form-error-handler';
import type {
  UnidadeAdministrativa,
  UpdateUnidadeAdministrativaPayload,
} from '../types/unidades-administrativas.types';

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const PRIMARY_SAVE_BUTTON_CLASS =
  'h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md';

function extractCodigoFinal(codigoCompleto: string): string {
  const codigoFinal = codigoCompleto.split('.').at(-1) ?? '';
  return codigoFinal.replace(/\D/g, '').slice(-3);
}

function buildUpdatePayload(
  unidade: UnidadeAdministrativa,
  values: UnidadeAdministrativaFormData,
): UpdateUnidadeAdministrativaPayload {
  const uoCodigo = unidade.unidade_orcamentaria_codigo.trim();

  const nextCodigo = `${uoCodigo}.${values.codigoFinal}`;
  const nextSigla = values.sigla.trim().toUpperCase();
  const nextNome = values.nome.trim();
  const nextStatus = values.status;

  const currentSigla = unidade.sigla.trim().toUpperCase();
  const currentNome = unidade.nome.trim();

  const payload: UpdateUnidadeAdministrativaPayload = {};

  if (nextCodigo !== unidade.codigo) {
    payload.codigo = nextCodigo;
  }

  if (nextSigla !== currentSigla) {
    payload.sigla = nextSigla;
  }

  if (nextNome !== currentNome) {
    payload.nome = nextNome;
  }

  if (nextStatus !== unidade.status) {
    payload.status = nextStatus;
  }

  return payload;
}

export default function UnidadesAdministrativasViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  const unidadeId = Number(id);
  const hasValidId = Number.isInteger(unidadeId) && unidadeId > 0;
  const canManage = Boolean(user?.is_gestor_patrimonio);

  const unidadeQuery = useUnidadeAdministrativaById(hasValidId ? unidadeId : null);
  const updateMutation = useUnidadeAdministrativaUpdate();

  const form = useForm<UnidadeAdministrativaFormData>({
    resolver: zodResolver(unidadeAdministrativaFormSchema),
    defaultValues: {
      codigoFinal: '',
      sigla: '',
      nome: '',
      status: 'ativa',
    },
  });

  const unidade = unidadeQuery.data;

  useEffect(() => {
    if (!unidade) {
      return;
    }

    form.reset({
      codigoFinal: extractCodigoFinal(unidade.codigo),
      sigla: unidade.sigla,
      nome: unidade.nome,
      status: unidade.status,
    });
  }, [form, unidade]);

  const handleCancel = () => {
    navigate('/unidades-administrativas');
  };

  const handleSave = async (values: UnidadeAdministrativaFormData) => {
    if (!unidade) {
      return;
    }

    form.clearErrors('root.serverError');

    const uoCodigo = unidade.unidade_orcamentaria_codigo?.trim();

    if (!uoCodigo) {
      const message = 'Não foi possível identificar o código da Unidade Orçamentária desta UA.';
      form.setError('root.serverError', { message });
      toast.error(message);
      return;
    }

    try {
      const payload = buildUpdatePayload(unidade, values);

      await updateMutation.mutateAsync({
        id: unidade.id,
        payload,
      });

      toast.success('Unidade Administrativa atualizada com sucesso.');
      navigate('/unidades-administrativas');
    } catch (error) {
      if (handleUnidadeAdministrativaBadRequestError(error, form)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar unidade administrativa.';
      form.setError('root.serverError', { type: 'server', message });
      toast.error(message);
    }
  };

  const handlePrimaryAction = () => {
    if (!canManage) {
      return;
    }

    if (!isEditing) {
      form.clearErrors('root.serverError');
      setIsEditing(true);
      return;
    }

    void form.handleSubmit(handleSave)();
  };

  if (!hasValidId) {
    return (
      <div className='space-y-4 p-8'>
        <UnidadesAdministrativasViewBreadcrumb isEditing={false} />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>Visualizar Unidade Administrativa</h1>

          <Button type='button' onClick={handleCancel} className={ACTION_BUTTON_CLASS}>
            Cancelar
          </Button>
        </div>

        <Card className='p-6'>
          <p className='text-sm text-red-700'>Identificador da Unidade Administrativa inválido.</p>
        </Card>
      </div>
    );
  }

  if (unidadeQuery.isLoading) {
    return (
      <div className='p-8 flex items-center justify-center'>
        <span className='text-gray-500 text-sm'>Carregando unidade administrativa...</span>
      </div>
    );
  }

  if (unidadeQuery.isError || !unidade) {
    const message =
      unidadeQuery.error instanceof Error
        ? unidadeQuery.error.message
        : 'Não foi possível carregar a unidade administrativa.';

    return (
      <div className='space-y-4 p-8'>
        <UnidadesAdministrativasViewBreadcrumb isEditing={false} />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>Visualizar Unidade Administrativa</h1>

          <Button type='button' onClick={handleCancel} className={ACTION_BUTTON_CLASS}>
            Cancelar
          </Button>
        </div>

        <Card className='p-6'>
          <p className='text-sm text-red-700'>{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-4 p-8'>
      <UnidadesAdministrativasViewBreadcrumb isEditing={isEditing} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          {isEditing ? 'Editar Unidade Administrativa' : 'Visualizar Unidade Administrativa'}
        </h1>

        <div className='flex items-center justify-end gap-3'>
          {canManage && (
            <Button
              type='button'
              className={isEditing ? PRIMARY_SAVE_BUTTON_CLASS : ACTION_BUTTON_CLASS}
              disabled={updateMutation.isPending}
              onClick={handlePrimaryAction}
            >
              {isEditing ? (updateMutation.isPending ? 'Salvando...' : 'Salvar') : 'Editar'}
            </Button>
          )}

          <Button type='button' onClick={handleCancel} className={ACTION_BUTTON_CLASS}>
            Cancelar
          </Button>
        </div>
      </div>

      <Card className='p-6'>
        <UnidadeAdministrativaForm
          form={form}
          uoCodigo={unidade.unidade_orcamentaria_codigo}
          uoNome={unidade.unidade_orcamentaria_nome}
          submitting={updateMutation.isPending}
          disabled={!isEditing}
          onSubmit={handleSave}
        />
      </Card>
    </div>
  );
}
