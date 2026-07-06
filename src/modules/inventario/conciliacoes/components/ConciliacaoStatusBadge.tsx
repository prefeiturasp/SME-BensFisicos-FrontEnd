import { cn } from '@/lib/utils';
import type { ConciliacaoStatus } from '../types/conciliacoes.types';

interface Props {
  status: ConciliacaoStatus;
}

const STATUS_STYLES: Record<ConciliacaoStatus, { label: string; className: string }> = {
  em_aberto: {
    label: 'Aberta',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  fechado: {
    label: 'Fechada',
    className: 'bg-gray-100 text-gray-700 border border-gray-300',
  },
  fechado_admin: {
    label: 'Fechada pelo Administrador - Não Conciliado',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
};

const BASE_CLASS =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

export function ConciliacaoStatusBadge({ status }: Readonly<Props>) {
  const config = STATUS_STYLES[status];
  return (
    <span
      className={cn(BASE_CLASS, config.className)}
      data-testid={`conciliacao-status-${status}`}
    >
      {config.label}
    </span>
  );
}
