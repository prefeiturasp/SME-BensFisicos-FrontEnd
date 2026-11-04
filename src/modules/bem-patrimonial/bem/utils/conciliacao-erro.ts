export const MENSAGEM_CONCILIACAO_EM_ABERTO =
  'Importação não realizada: existe Conciliação em aberto.'

/**
 * Detecta se um payload de erro do backend está relacionado a Conciliação,
 * independentemente do status HTTP ou do formato exato do payload
 * (detail, erro, erros_por_linha, mensagens de constraint de banco, etc.).
 *
 * Usado pelo hook useBemImport para respostas <500 (que resolvem
 * normalmente com { status, data }), garantindo que qualquer falha causada
 * por Conciliação apareça para o usuário com uma mensagem padronizada de
 * negócio — nunca com uma mensagem técnica genérica ou de constraint de
 * banco.
 */
export function ehErroDeConciliacao(payload: unknown): boolean {
  try {
    return JSON.stringify(payload ?? {}).toLowerCase().includes('concilia')
  } catch {
    return false
  }
}