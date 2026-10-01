import type { StatusTone } from '@/components/status/StatusBadge'

/**
 * Mapeamento do status do Bem Patrimonial para o tom semântico único de
 * status do sistema. Ver `src/components/status/StatusBadge.tsx`.
 */
const BEM_STATUS_TONE: Record<string, StatusTone> = {
  aguardando_aprovacao: 'pending',
  aprovado: 'success',
  nao_aprovado: 'danger',
  bloqueado: 'pending',
  baixa_fisica_aguardando_aprovacao: 'pending',
  baixa_fisica: 'neutral',
  transferido: 'neutral',
}

export function getBemStatusTone(status: string): StatusTone {
  return BEM_STATUS_TONE[status] ?? 'neutral'
}
