/**
 * Deriva o valor do select "Formato" a partir dos dois campos booleanos
 * mutuamente exclusivos do bem (numero_formato_antigo / sem_numeracao).
 * Usado tanto na visualização (BemDetailPage) quanto na edição
 * (BemEditPage) para manter a mesma regra em um único lugar.
 */
export function valorSelectFormato(
  formatoAntigo: boolean,
  semNumeracao: boolean
): string {
  if (formatoAntigo) return 'formato_anterior'
  if (semNumeracao) return 'sem_numeracao'
  return ''
}