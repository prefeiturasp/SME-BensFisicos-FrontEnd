import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Paleta semântica única de status do sistema (definida na história de
 * padronização de status):
 *
 *  - success (verde):  aprovado, aceito, ativo, aberto
 *  - pending (amarelo/laranja): pendente, em elaboração
 *  - danger  (vermelho): rejeitado, recusado
 *  - neutral (cinza): cancelado, inativo, fechado
 *
 * Este é o ÚNICO componente de status do sistema: qualquer tela de listagem
 * ou de detalhe que precise exibir o status de um registro (bem patrimonial,
 * movimentação, baixa física, conciliação, parâmetro, usuário, unidade)
 * deve renderizar o status através dele, para garantir que a mesma cor e o
 * mesmo formato visual sejam sempre usados para o mesmo significado.
 *
 * Cada módulo é responsável apenas por mapear seu próprio valor de status
 * para um StatusTone (ver pastas `utils/status.ts` de cada módulo) — a
 * apresentação visual (cor, formato de badge/pill) fica centralizada aqui.
 */
export type StatusTone = 'success' | 'pending' | 'danger' | 'neutral'

export interface StatusBadgeProps {
  /** Tom semântico do status (ver paleta acima). */
  tone: StatusTone
  /** Texto a ser exibido (normalmente o `status_display` vindo do backend). */
  label: string
  className?: string
  /** Valor completo do `data-testid` do badge, quando necessário para testes. */
  testId?: string
}

const TONE_VARIANT: Record<StatusTone, 'success' | 'pending' | 'danger' | 'neutral'> = {
  success: 'success',
  pending: 'pending',
  danger: 'danger',
  neutral: 'neutral',
}

export function StatusBadge({ tone, label, className, testId }: Readonly<StatusBadgeProps>) {
  return (
    <Badge
      variant={TONE_VARIANT[tone]}
      className={cn(className)}
      data-testid={testId}
    >
      {label}
    </Badge>
  )
}
