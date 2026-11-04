import type { StatusTone } from '@/components/status/StatusBadge'

/**
 * Mapeamento do status da Baixa Física para o tom semântico único de status
 * do sistema. Ver `src/components/status/StatusBadge.tsx`.
 *
 * "Aceita" usa o mesmo tom (success/verde) usado em Movimentações e demais
 * módulos, conforme exigido pela história de padronização de status.
 */
const BAIXA_STATUS_TONE: Record<string, StatusTone> = {
  aguardando_envio: 'pending', // exibido como "Em elaboração" na UI
  solicitada: 'pending',
  aceita: 'success',
  recusada: 'danger',
  cancelada: 'neutral',
}

export function getBaixaStatusTone(status: string): StatusTone {
  return BAIXA_STATUS_TONE[status] ?? 'neutral'
}
