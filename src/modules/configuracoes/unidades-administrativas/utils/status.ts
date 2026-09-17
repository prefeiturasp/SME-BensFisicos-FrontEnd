import type { StatusTone } from '@/components/status/StatusBadge'
import type { UAStatus } from '../types/unidades-administrativas.types'

/**
 * Mapeamento do status da Unidade Administrativa para o tom semântico único
 * de status do sistema. Ver `src/components/status/StatusBadge.tsx`.
 */
const UA_STATUS_TONE: Record<UAStatus, StatusTone> = {
  ativa: 'success',
  inativa: 'neutral',
}

export function getUnidadeAdministrativaStatusTone(status: UAStatus): StatusTone {
  return UA_STATUS_TONE[status] ?? 'neutral'
}
