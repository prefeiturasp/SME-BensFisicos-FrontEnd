import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConciliacaoItemSituacao } from '../types/conciliacoes.types';
import { getSituacaoVisualConfig } from '../utils/situacao-config';

const BASE_OPTION_CARD =
  'flex items-center gap-3 rounded-md border bg-white px-4 py-3 text-sm transition-colors cursor-pointer';

function getOptionClasses(situacao: ConciliacaoItemSituacao, selected: boolean) {
  const config = getSituacaoVisualConfig(situacao);
  return cn(
    BASE_OPTION_CARD,
    config.optionContainerClassName,
    selected ? config.optionSelectedClassName : config.optionHoverClassName,
  );
}

interface OcorrenciaOpcoesListProps {
  opcoes: ReadonlyArray<{ value: ConciliacaoItemSituacao; label: string }>;
  selected: ConciliacaoItemSituacao | '';
  onSelect: (value: ConciliacaoItemSituacao) => void;
  disabled?: boolean;
}

export function OcorrenciaOpcoesList({
  opcoes,
  selected,
  onSelect,
  disabled = false,
}: Readonly<OcorrenciaOpcoesListProps>) {
  if (opcoes.length === 0) {
    return null;
  }

  return (
    <div
      className='grid grid-cols-1 gap-3 md:grid-cols-2'
      role='radiogroup'
      aria-label='Selecione a situação da ocorrência'
      data-testid='ocorrencia-opcoes-list'
    >
      {opcoes.map((opcao) => {
        const isSelected = opcao.value === selected;
        const visual = getSituacaoVisualConfig(opcao.value);
        const containerClass = getOptionClasses(opcao.value, isSelected);

        return (
          <button
            key={opcao.value}
            type='button'
            role='radio'
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelect(opcao.value)}
            className={cn(containerClass, disabled && 'cursor-not-allowed opacity-60')}
            data-testid={`ocorrencia-opcao-${opcao.value}`}
            data-selected={isSelected ? 'true' : 'false'}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                isSelected
                  ? cn('border-transparent text-white', visual.dotClassName)
                  : 'border-gray-300 bg-white text-transparent',
              )}
              aria-hidden='true'
            >
              {isSelected ? <Check className='h-3 w-3' /> : null}
            </span>
            <span
              className={cn(
                'text-sm font-semibold',
                isSelected ? visual.optionTextSelectedClassName : 'text-gray-700',
              )}
            >
              {opcao.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
