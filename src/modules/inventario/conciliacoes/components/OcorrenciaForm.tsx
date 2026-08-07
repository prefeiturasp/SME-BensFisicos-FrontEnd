import { useEffect, useMemo } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { CampoDescricaoDivergencia } from './CampoDescricaoDivergencia';
import { CampoObservacao } from './CampoObservacao';
import { OcorrenciaMensagemCondicional } from './OcorrenciaMensagemCondicional';
import { OcorrenciaOpcoesList } from './OcorrenciaOpcoesList';
import { ROOT_ERROR_ALERT_CLASS } from '../utils/form-styles';
import type { OcorrenciaFormData } from '../validators/ocorrencia-form.schema';
import type {
  ConciliacaoItemSituacao,
  ConciliacaoSituacaoDisponivel,
} from '../types/conciliacoes.types';

interface OcorrenciaFormProps {
  form: UseFormReturn<OcorrenciaFormData>;
  opcoes: ReadonlyArray<ConciliacaoSituacaoDisponivel>;
  situacaoAnterior: ConciliacaoItemSituacao;
  mostrarMensagemCondicional?: boolean;
  disabled?: boolean;
}

export function OcorrenciaForm({
  form,
  opcoes,
  situacaoAnterior,
  mostrarMensagemCondicional = true,
  disabled = false,
}: Readonly<OcorrenciaFormProps>) {
  const opcoesNormalizadas = useMemo(
    () => opcoes.map((op) => ({ value: op.value, label: op.label })),
    [opcoes],
  );

  const situacaoSelecionada = useWatch({
    control: form.control,
    name: 'situacao',
  });

  const divergenciaValue = useWatch({
    control: form.control,
    name: 'divergencia',
  });
  const observacaoValue = useWatch({
    control: form.control,
    name: 'observacao',
  });

  useEffect(() => {
    if (situacaoSelecionada === 'divergente') {
      if (observacaoValue) {
        form.setValue('observacao', '', { shouldValidate: false, shouldDirty: true });
      }
    } else if (divergenciaValue) {
      form.setValue('divergencia', '', { shouldValidate: false, shouldDirty: true });
    }
  }, [divergenciaValue, form, observacaoValue, situacaoSelecionada]);

  const handleSelectSituacao = (value: ConciliacaoItemSituacao) => {
    form.setValue('situacao', value, { shouldValidate: true, shouldDirty: true });
  };

  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <Form {...form}>
      <form
        className='space-y-5'
        onSubmit={form.handleSubmit(() => undefined)}
        data-testid='ocorrencia-form'
      >
        {rootError && (
          <div
            className={ROOT_ERROR_ALERT_CLASS}
            role='alert'
            data-testid='ocorrencia-form-root-error'
          >
            {rootError}
          </div>
        )}

        <OcorrenciaMensagemCondicional
          situacaoAnterior={situacaoAnterior}
          mostrar={mostrarMensagemCondicional}
        />

        <OcorrenciaOpcoesList
          opcoes={opcoesNormalizadas}
          selected={(situacaoSelecionada as ConciliacaoItemSituacao) ?? ''}
          onSelect={handleSelectSituacao}
          disabled={disabled}
        />

        {situacaoSelecionada === 'divergente' ? (
          <CampoDescricaoDivergencia
            form={form}
            name='divergencia'
            disabled={disabled}
          />
        ) : (
          <CampoObservacao
            form={form}
            name='observacao'
            disabled={disabled}
          />
        )}
      </form>
    </Form>
  );
}
