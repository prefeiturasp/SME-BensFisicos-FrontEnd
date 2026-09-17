import { StatusBadge } from '@/components/status/StatusBadge';
import type { ConciliacaoStatus } from '../types/conciliacoes.types';
import { getConciliacaoStatusTone } from '../utils/status';

interface Props {
  status: ConciliacaoStatus;
}

const STATUS_LABEL: Record<ConciliacaoStatus, string> = {
  em_aberto: 'Aberta',
  fechado: 'Fechada',
  fechado_admin: 'Fechada pelo Administrador - Não Conciliado',
};

export function ConciliacaoStatusBadge({ status }: Readonly<Props>) {
  return (
    <StatusBadge
      tone={getConciliacaoStatusTone(status)}
      label={STATUS_LABEL[status]}
      testId={`conciliacao-status-${status}`}
    />
  );
}
