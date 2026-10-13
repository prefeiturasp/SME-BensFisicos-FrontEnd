export const BEM_LIMITS = {
  nome: 255,
  descricao: 1000,
  marca: 255,
  modelo: 255,
  localizacao: 255,
  numero_processo: 64,
  numero_patrimonial: 20,
  observacao: 1000,
} as const

export function mensagemLimiteMaximo(limite: number): string {
  return `Deve ter no máximo ${limite} caracteres.`
}

export function erroLimiteMaximo(
  texto: string | null | undefined,
  limite: number
): string | undefined {
  const atual = (texto ?? '').trim()
  if (atual && atual.length > limite) return mensagemLimiteMaximo(limite)
  return undefined
}
