import { describe, it, expect } from 'vitest'
import {
  formatarValorBRL,
  formatarValorInput,
  maskValorUnitario,
  serializarValorUnitario,
  validarValorUnitario,
} from '../valor-monetario'

describe('valor-monetario', () => {
  it('máscara única e visível: ponto de milhar, recusa letras e negativos', () => {
    expect(maskValorUnitario('12ab34')).toBe('1.234')
    expect(maskValorUnitario('-10,00')).toBe('10,00')
    expect(maskValorUnitario('1.234,56')).toBe('1.234,56')
    expect(maskValorUnitario('1500')).toBe('1.500')
    expect(maskValorUnitario('1500,00')).toBe('1.500,00')
  })

  it('validação: recusa letras e negativos com mesma mensagem', () => {
    expect(validarValorUnitario('abc')).toBe(
      'Valor unitário deve ser um número positivo.'
    )
    expect(validarValorUnitario('-10')).toBe(
      'Valor unitário deve ser um número positivo.'
    )
  })

  it('validação: aceita valor válido e exige obrigatório', () => {
    expect(validarValorUnitario('1.234,56')).toBeUndefined()
    expect(validarValorUnitario('1500,00')).toBeUndefined()
    expect(validarValorUnitario('1.500')).toBeUndefined()
    expect(validarValorUnitario('')).toBe('Valor Unitário é obrigatório.')
  })

  it('input/blur: formata para 2 casas sem R$', () => {
    expect(formatarValorInput(5000)).toBe('5.000,00')
    expect(formatarValorInput('5000.00')).toBe('5.000,00')
    expect(formatarValorInput('1.500')).toBe('1.500,00')
    expect(formatarValorInput('1.500,5')).toBe('1.500,50')
  })

  it('envio: serializa para formato com ponto aceito pela API', () => {
    expect(serializarValorUnitario('5.000,00')).toBe('5000.00')
    expect(serializarValorUnitario('1.234,56')).toBe('1234.56')
    expect(serializarValorUnitario('')).toBe('')
  })
  it('exibição: formata no padrão R$ 1.234,56', () => {
    const formatado = formatarValorBRL(1234.56)
    expect(formatado).toContain('R$')
    expect(formatado).toContain('1.234,56')
    expect(formatarValorBRL('5000')).toContain('5.000,00')
    expect(formatarValorBRL('1.234,56')).toContain('1.234,56')
  })
})
