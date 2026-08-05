import { cn } from '@/lib/utils';
import type { ConciliacaoItemSituacao } from '../types/conciliacoes.types';
import { getSituacaoVisualConfig } from '../utils/situacao-config';

interface SituacaoBadgeProps {
  situacao: ConciliacaoItemSituacao;
  className?: string;
}

const BASE_CLASS =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

export function SituacaoBadge({ situacao, className }: Readonly<SituacaoBadgeProps>) {
  const config = getSituacaoVisualConfig(situacao);
  return (
    <span
      className={cn(BASE_CLASS, config.badgeClassName, className)}
      data-testid={`situacao-badge-${situacao}`}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dotClassName)} aria-hidden='true' />
      {config.label}
    </span>
  );
}
