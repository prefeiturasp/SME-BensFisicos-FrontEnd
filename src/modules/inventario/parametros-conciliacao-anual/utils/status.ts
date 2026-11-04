import type { StatusTone } from '@/components/status/StatusBadge'

/**
 * Mapeamento do status do Parâmetro de Conciliação Anual para o tom
 * semântico único de status do sistema. Ver
 * `src/components/status/StatusBadge.tsx`.
 */
export function getParametroConciliacaoStatusTone(ativo: boolean): StatusTone {
  return ativo ? 'success' : 'neutral'
}
