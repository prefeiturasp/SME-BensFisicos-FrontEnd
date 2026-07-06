import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ConciliacaoResumoSituacoes } from '../types/conciliacoes.types';

interface Props {
  conciliacaoId: number;
  totalItens: number;
  resumo: ConciliacaoResumoSituacoes;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SITUACOES = [
  { key: 'encontrados', label: 'Encontrados', color: 'bg-green-600' },
  { key: 'nao_encontrados', label: 'Não encontrados', color: 'bg-red-600' },
  { key: 'divergentes', label: 'Divergentes', color: 'bg-amber-500' },
  { key: 'em_processo_baixa', label: 'Em processo de baixa', color: 'bg-violet-600' },
  { key: 'baixa_fisica', label: 'Baixa Física', color: 'bg-gray-400' },
] as const;

const TRIGGER_CLASS =
  'inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/40 data-[state=open]:border-gray-400 data-[state=open]:bg-gray-50';

const CONTENT_CLASS = 'w-56 rounded-md border border-gray-200 bg-white p-3 text-gray-700 shadow-lg';

const ROW_CLASS = 'flex items-center justify-between text-xs text-gray-700 py-1';

const LABEL_CLASS = 'flex items-center gap-2';

const TOTAL_ROW_CLASS =
  'mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs font-bold text-green-800';

export function ConciliacoesItensExpander({
  conciliacaoId,
  totalItens,
  resumo,
  isOpen,
  onOpenChange,
}: Readonly<Props>) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={TRIGGER_CLASS}
          aria-label='Expandir detalhes de itens da conciliação'
          data-testid='conciliacoes-itens-trigger'
        >
          <span>{totalItens} itens</span>
          <ChevronDown size={14} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        side='bottom'
        sideOffset={4}
        collisionPadding={8}
        className={CONTENT_CLASS}
        data-testid={`conciliacoes-itens-popover-${conciliacaoId}`}
      >
        <ul className='space-y-1'>
          {SITUACOES.map((situacao) => (
            <li
              key={situacao.key}
              className={ROW_CLASS}
              data-testid={`conciliacoes-itens-row-${situacao.key}`}
            >
              <span className={LABEL_CLASS}>
                <span className={`h-2 w-2 rounded-full ${situacao.color}`} aria-hidden='true' />
                {situacao.label}
              </span>
              <span className='font-semibold'>{resumo[situacao.key]}</span>
            </li>
          ))}
        </ul>

        <p className={TOTAL_ROW_CLASS}>
          <span>Total</span>
          <span>{totalItens}</span>
        </p>
      </PopoverContent>
    </Popover>
  );
}
