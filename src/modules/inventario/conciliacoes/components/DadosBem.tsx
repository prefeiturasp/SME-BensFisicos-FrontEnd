import { CircleHelp } from 'lucide-react';
import { CampoReadonly } from './CampoReadonly';
import { ConciliacaoItemSituacaoBadge } from './ConciliacaoItemSituacaoBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  ConciliacaoItemBem,
  ConciliacaoItemSituacao,
} from '../types/conciliacoes.types';

const HELPER_BUTTON_CLASS =
  'inline-flex text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D57]/30 rounded-sm';

const HELPER_LABEL_CLASS = 'text-sm font-semibold text-gray-700';

const READONLY_DIVERGENCIA_HELPER_TEXT =
  'Detalhe da divergência registrada para o item no inventário atual.';

const READONLY_OBSERVACAO_HELPER_TEXT =
  'Observação registrada para o item no inventário atual.';

const READONLY_FIELD_CLASS =
  'min-h-[2.75rem] rounded-xs border border-gray-300 bg-[#F5F5F5] px-4 py-2 text-sm text-gray-700 whitespace-pre-line break-words';

interface DadosBemProps {
  numeroPatrimonial: string;
  nome: string;
  situacao: ConciliacaoItemSituacao;
  observacao?: string;
  divergencia?: string;
  bem?: ConciliacaoItemBem | null;
}

function FieldLabelWithTooltip({
  htmlFor,
  label,
  tooltip,
}: Readonly<{ htmlFor?: string; label: string; tooltip: string }>) {
  return (
    <div className='flex h-6 items-center gap-2'>
      <label htmlFor={htmlFor} className={HELPER_LABEL_CLASS}>
        {label}
      </label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className={HELPER_BUTTON_CLASS}
            aria-label={`Ajuda sobre ${label}`}
            tabIndex={-1}
          >
            <CircleHelp className='h-4 w-4' />
          </button>
        </TooltipTrigger>
        <TooltipContent side='top' sideOffset={6}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function SituacaoReadonlyField({
  situacao,
  bem,
}: Readonly<{ situacao: ConciliacaoItemSituacao; bem?: ConciliacaoItemBem | null }>) {
  return (
    <div className='space-y-1'>
      <div className='flex h-6 items-center'>
        <label
          htmlFor='ocorrencia-dados-bem-situacao'
          className='text-sm font-semibold text-gray-700'
        >
          Situação
        </label>
      </div>
      <div
        id='ocorrencia-dados-bem-situacao'
        className={cn(
          'flex min-h-[2.75rem] items-center rounded-xs border border-gray-300 bg-[#F5F5F5] px-4 py-2',
        )}
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
  const secondaryValue = useDivergencia
    ? divergencia
    : temObservacao
      ? observacao
      : '-';
  const secondaryHelper = useDivergencia
    ? READONLY_DIVERGENCIA_HELPER_TEXT
    : READONLY_OBSERVACAO_HELPER_TEXT;
  const secondaryTestId = useDivergencia
    ? 'dados-bem-divergencia'
    : 'dados-bem-observacao';

  return (
    <section
      className='space-y-5 p-4'
      data-testid='dados-bem-section'
      aria-label='Dados do bem'
    >
      <h3 className='text-base font-bold text-[#2F7D57]'>Dados do bem</h3>

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
