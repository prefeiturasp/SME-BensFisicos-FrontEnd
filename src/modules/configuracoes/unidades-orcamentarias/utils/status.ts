import type { StatusTone } from '@/components/status/StatusBadge'

/**
 * Mapeamento do status da Unidade Orçamentária para o tom semântico único de
 * status do sistema. Ver `src/components/status/StatusBadge.tsx`.
 */
export function getUnidadeOrcamentariaStatusTone(ativa: boolean): StatusTone {
  return ativa ? 'success' : 'neutral'
}
