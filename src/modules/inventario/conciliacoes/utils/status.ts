import type { StatusTone } from '@/components/status/StatusBadge'
import type { ConciliacaoStatus } from '../types/conciliacoes.types'

/**
 * Mapeamento do status da Conciliação para o tom semântico único de status
 * do sistema. Ver `src/components/status/StatusBadge.tsx`.
 *
 * "fechado_admin" continua funcionalmente distinto de "fechado" (fecha sem
 * conciliação completa), mas visualmente ambos representam um registro
 * fechado, então usam o mesmo tom neutro (cinza) da paleta padronizada.
 */
const CONCILIACAO_STATUS_TONE: Record<ConciliacaoStatus, StatusTone> = {
  em_aberto: 'success',
  fechado: 'neutral',
  fechado_admin: 'neutral',
}

export function getConciliacaoStatusTone(status: ConciliacaoStatus): StatusTone {
  return CONCILIACAO_STATUS_TONE[status] ?? 'neutral'
}
