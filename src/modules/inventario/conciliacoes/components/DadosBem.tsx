import { CampoReadonly } from './CampoReadonly';
import { ConciliacaoItemSituacaoBadge } from './ConciliacaoItemSituacaoBadge';
import { FieldLabelWithTooltip } from './FieldLabelWithTooltip';
import { cn } from '@/lib/utils';
import type {
  ConciliacaoItemBem,
  ConciliacaoItemSituacao,
} from '../types/conciliacoes.types';
import {
  LABEL_CLASS,
  LABEL_WITH_TOOLTIP_ROW_CLASS,
  READONLY_FIELD_CLASS,
  SECTION_QUADRANTE_CLASS,
  SECTION_TITLE_CLASS,
} from '../utils/form-styles';

const READONLY_DIVERGENCIA_HELPER_TEXT =
  'Detalhe da divergência registrada para o item no inventário atual.';

const READONLY_OBSERVACAO_HELPER_TEXT =
  'Observação registrada para o item no inventário atual.';

const READONLY_BADGE_FIELD_CLASS =
  'flex min-h-[2.75rem] items-center rounded-xs border border-gray-300 bg-[#F5F5F5] px-4 py-2';

interface DadosBemProps {
  numeroPatrimonial: string;
  nome: string;
  situacao: ConciliacaoItemSituacao;
  observacao?: string;
  divergencia?: string;
  bem?: ConciliacaoItemBem | null;
}

function SituacaoReadonlyField({
  situacao,
  bem,
}: Readonly<{ situacao: ConciliacaoItemSituacao; bem?: ConciliacaoItemBem | null }>) {
  return (
    <div className='space-y-1'>
      <div className={LABEL_WITH_TOOLTIP_ROW_CLASS}>
        <label htmlFor='ocorrencia-dados-bem-situacao' className={LABEL_CLASS}>
          Situação
        </label>
      </div>
      <div
        id='ocorrencia-dados-bem-situacao'
        className={cn(READONLY_BADGE_FIELD_CLASS)}
        data-testid='dados-bem-situacao-wrapper'
        data-bem-status={bem?.status ?? ''}
      >
        <ConciliacaoItemSituacaoBadge situacao={situacao} />
      </div>
    </div>
  );
}

export function DadosBem({
  numeroPatrimonial,
  nome,
  situacao,
  observacao = '',
  divergencia = '',
  bem,
}: Readonly<DadosBemProps>) {
  const isDivergente = situacao === 'divergente';
  const temDivergencia = divergencia.trim().length > 0;
  const temObservacao = observacao.trim().length > 0;
  const useDivergencia = isDivergente && temDivergencia;
  const secondaryLabel = useDivergencia ? 'Divergência' : 'Observação';
  let secondaryValue: string;
  if (useDivergencia) {
    secondaryValue = divergencia;
  } else if (temObservacao) {
    secondaryValue = observacao;
  } else {
    secondaryValue = '-';
  }
  const secondaryHelper = useDivergencia
    ? READONLY_DIVERGENCIA_HELPER_TEXT
    : READONLY_OBSERVACAO_HELPER_TEXT;
  const secondaryTestId = useDivergencia
    ? 'dados-bem-divergencia'
    : 'dados-bem-observacao';

  return (
    <section
      className={SECTION_QUADRANTE_CLASS}
      data-testid='dados-bem-section'
      aria-label='Dados do bem'
    >
      <h2 className={SECTION_TITLE_CLASS}>Dados do bem</h2>

      <div className='grid grid-cols-1 items-start gap-x-8 gap-y-5 md:grid-cols-2'>
        <CampoReadonly
          id='dados-bem-numero-patrimonial'
          label='Número Patrimonial'
          value={numeroPatrimonial}
        />

        <CampoReadonly
          id='dados-bem-nome'
          label='Nome do bem'
          value={nome}
        />
      </div>

      <div className='grid grid-cols-1 items-start gap-x-8 gap-y-5 md:grid-cols-2'>
        <SituacaoReadonlyField situacao={situacao} bem={bem} />

        <div className='space-y-1'>
          <FieldLabelWithTooltip
            htmlFor='dados-bem-secundario'
            label={secondaryLabel}
            tooltip={secondaryHelper}
          />
          <div
            id='dados-bem-secundario'
            className={cn(READONLY_FIELD_CLASS)}
            data-testid={secondaryTestId}
          >
            {secondaryValue}
          </div>
        </div>
      </div>
    </section>
  );
}
