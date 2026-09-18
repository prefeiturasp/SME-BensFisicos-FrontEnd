import type { StatusTone } from '@/components/status/StatusBadge'

/**
 * Mapeamento do status da Movimentação para o tom semântico único de status
 * do sistema. Ver `src/components/status/StatusBadge.tsx`.
 *
 * "Aceita" usa o mesmo tom (success/verde) usado em Baixas Físicas e demais
 * módulos, conforme exigido pela história de padronização de status.
 */
const MOVIMENTACAO_STATUS_TONE: Record<string, StatusTone> = {
  enviada: 'pending',
  aceita: 'success',
  rejeitada: 'danger',
  cancelada: 'neutral',
}

export function getMovimentacaoStatusTone(status: string): StatusTone {
  return MOVIMENTACAO_STATUS_TONE[status] ?? 'neutral'
}
