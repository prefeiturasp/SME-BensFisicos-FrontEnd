// Helpers de Número do Processo no padrão XXXX.XXXX/XXXXXXX-X.
// Ficam fora de types/ para entrarem no relatório de cobertura.

export const PROCESSO_BAIXA_REGEX = /^\d{4}\.\d{4}\/\d{7}-\d$/

export function maskProcessoBaixa(value: string): string {
    const digits = value.replaceAll(/\D/g, "").slice(0, 16)
    if (digits.length <= 4) return digits
    if (digits.length <= 8) return `${digits.slice(0, 4)}.${digits.slice(4)}`
    if (digits.length <= 15) return `${digits.slice(0, 4)}.${digits.slice(4, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 4)}.${digits.slice(4, 8)}/${digits.slice(8, 15)}-${digits.slice(15, 16)}`
}

export function isProcessoBaixaValido(value: string): boolean {
    return PROCESSO_BAIXA_REGEX.test(value)
}
