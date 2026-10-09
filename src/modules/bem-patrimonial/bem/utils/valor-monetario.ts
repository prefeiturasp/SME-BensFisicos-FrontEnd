export const MENSAGEM_VALOR_OBRIGATORIO = 'Valor Unitário é obrigatório.'
export const MENSAGEM_VALOR_INVALIDO =
  'Valor unitário deve ser um número positivo.'
export const DICA_VALOR_UNITARIO = 'Formato 0,00 ou 0.000,00.'

const MAX_DIGITOS_INTEIROS = 14
const MAX_DIGITOS_DECIMAIS = 2
const MILHAR_BR = /^\d{1,3}(\.\d{3})+$/
const NUMERO_DECIMAL = /^\d+(\.\d+)?$/
const APENAS_DIGITOS = /\D/g

export const VALOR_UNITARIO_TAMANHO_MAX = 20

export type ValorMonetarioInput = string | number | null | undefined

function formatarCom2Casas(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatarInteiroMilhar(digitos: string): string {
  const numero = digitos ? Number(digitos) : 0
  return numero.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

export function maskValorUnitario(valor: string): string {
  if (!valor) return ''
  const limpo = valor.replaceAll(/[^0-9.,]/g, '')
  if (!limpo) return ''
  const temVirgula = limpo.includes(',')
  const partes = limpo.split(',')
  const inteiroBruto = (partes[0] || '')
    .replaceAll(APENAS_DIGITOS, '')
    .slice(0, MAX_DIGITOS_INTEIROS)
  const decimalBruto = partes
    .slice(1)
    .join('')
    .replaceAll(APENAS_DIGITOS, '')
    .slice(0, MAX_DIGITOS_DECIMAIS)
  const inteiroFmt = formatarInteiroMilhar(inteiroBruto)
  if (!temVirgula) return inteiroFmt
  return `${inteiroFmt},${decimalBruto}`
}

export function formatarValorInput(valor: ValorMonetarioInput): string {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return ''
  }
  const texto = String(valor).trim()
  if (texto.includes(',')) {
    const num = Number(texto.replaceAll('.', '').replaceAll(',', '.'))
    if (Number.isNaN(num)) return texto
    return formatarCom2Casas(num)
  }
  if (MILHAR_BR.test(texto)) {
    const num = Number(texto.replaceAll('.', ''))
    if (Number.isNaN(num)) return texto
    return formatarCom2Casas(num)
  }
  const num = Number(texto)
  if (Number.isNaN(num)) return texto
  return formatarCom2Casas(num)
}

export function parseValorUnitario(valor: ValorMonetarioInput): number {
  if (valor === null || valor === undefined) return Number.NaN
  if (typeof valor === 'number') return valor
  const texto = String(valor).trim()
  if (!texto) return Number.NaN
  const normalizado = texto.includes(',')
    ? texto.replaceAll('.', '').replaceAll(',', '.')
    : texto
  if (!NUMERO_DECIMAL.test(normalizado)) return Number.NaN
  return Number(normalizado)
}

export function validarValorUnitario(
  valor: ValorMonetarioInput
): string | undefined {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return MENSAGEM_VALOR_OBRIGATORIO
  }
  const texto = String(valor).trim()
  if (texto.includes('-') || /[a-zA-Z]/.test(texto)) {
    return MENSAGEM_VALOR_INVALIDO
  }
  const numero = parseValorUnitario(texto)
  if (Number.isNaN(numero) || numero < 0) {
    return MENSAGEM_VALOR_INVALIDO
  }
  return undefined
}

export function formatarValorBRL(valor: ValorMonetarioInput): string {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return ''
  }
  const numero = parseValorUnitario(valor)
  if (Number.isNaN(numero)) return String(valor)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero)
}

export function serializarValorUnitario(
  valor: ValorMonetarioInput
): string | number | null | undefined {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return valor
  }
  const numero = parseValorUnitario(valor)
  if (Number.isNaN(numero)) return valor
  return numero.toFixed(2)
}
