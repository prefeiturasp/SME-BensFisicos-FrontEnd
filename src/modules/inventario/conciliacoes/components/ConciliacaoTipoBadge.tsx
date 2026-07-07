import { cn } from '@/lib/utils';
import type { ConciliacaoTipo } from '../types/conciliacoes.types';

interface Props {
  tipo: ConciliacaoTipo;
}

const TIPO_STYLES: Record<ConciliacaoTipo, { label: string; className: string }> = {
  anual: {
    label: 'Anual',
    className: 'bg-sky-50 text-sky-700 border border-sky-200',
  },
  eventual: {
    label: 'Eventual',
    className: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
};

const BASE_CLASS =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

export function ConciliacaoTipoBadge({ tipo }: Readonly<Props>) {
  const config = TIPO_STYLES[tipo];
  return (
    <span className={cn(BASE_CLASS, config.className)} data-testid={`conciliacao-tipo-${tipo}`}>
      {config.label}
    </span>
  );
}
