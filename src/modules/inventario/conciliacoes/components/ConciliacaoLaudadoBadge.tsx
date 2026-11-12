import { cn } from '@/lib/utils';
import { LAUDADO_PARA_BAIXA_VISUAL_CONFIG } from '../utils/situacao-config';

const BASE_CLASS =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

interface Props {
  className?: string;
}

export function ConciliacaoLaudadoBadge({ className }: Readonly<Props>) {
  return (
    <span
      className={cn(BASE_CLASS, LAUDADO_PARA_BAIXA_VISUAL_CONFIG.badgeClassName, className)}
      data-testid='item-laudado-para-baixa'
    >
      <span
        className={cn('h-2 w-2 rounded-full', LAUDADO_PARA_BAIXA_VISUAL_CONFIG.dotClassName)}
        aria-hidden='true'
      />
      {LAUDADO_PARA_BAIXA_VISUAL_CONFIG.label}
    </span>
  );
}
