import type { StatusTone } from '@/components/status/StatusBadge'

/**
 * Mapeamento do status do Usuário para o tom semântico único de status do
 * sistema. Ver `src/components/status/StatusBadge.tsx`.
 */
const USUARIO_STATUS_TONE: Record<string, StatusTone> = {
  ativo: 'success',
  inativo: 'neutral',
}

export function getUsuarioStatusTone(status: string): StatusTone {
  return USUARIO_STATUS_TONE[status] ?? 'neutral'
}
