import { cn } from '@/lib/utils';
import type { ConciliacaoItemSituacao } from '../types/conciliacoes.types';

interface Props {
  situacao: ConciliacaoItemSituacao;
}

const SITUACAO_STYLES: Record<
  ConciliacaoItemSituacao,
  { label: string; className: string; dotClass: string }
> = {
  encontrado_sem_divergencia: {
    label: 'Encontrado sem divergência',
    className: 'bg-green-50 text-green-700 border border-green-200',
    dotClass: 'bg-green-600',
  },
  encontrado: {
    label: 'Encontrado',
    className: 'bg-sky-50 text-sky-700 border border-sky-200',
    dotClass: 'bg-sky-600',
  },
  nao_encontrado: {
    label: 'Não encontrado',
    className: 'bg-red-50 text-red-700 border border-red-200',
    dotClass: 'bg-red-600',
  },
  divergente: {
    label: 'Divergente',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500',
  },
  em_processo_de_baixa_fisica: {
    label: 'Em processo de baixa',
    className: 'bg-violet-50 text-violet-700 border border-violet-200',
    dotClass: 'bg-violet-600',
  },
  baixa_fisica: {
    label: 'Baixa Física',
    className: 'bg-gray-100 text-gray-700 border border-gray-300',
    dotClass: 'bg-gray-400',
  },
};

const BASE_CLASS =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

export function ConciliacaoItemSituacaoBadge({ situacao }: Readonly<Props>) {
  const config = SITUACAO_STYLES[situacao];
  return (
    <span
      className={cn(BASE_CLASS, config.className)}
      data-testid={`item-situacao-${situacao}`}
    >
      <span
        className={cn('h-2 w-2 rounded-full', config.dotClass)}
        aria-hidden='true'
      />
      {config.label}
    </span>
  );
}
