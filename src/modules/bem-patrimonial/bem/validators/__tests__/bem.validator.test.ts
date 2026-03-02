import { describe, it, expect } from 'vitest'
import { validateBem } from '../bem.validator'

describe('validateBem', () => {
  it('deve bloquear edição quando status for baixa_fisica', () => {
    const result = validateBem({
      status: 'baixa_fisica',
      nome: 'Mesa',
      numero_patrimonial: '123',
      localizacao: 'Sala 1',
    })

    expect(result._global).toBe(
      'Este bem está com status "Baixa Física" e não pode ser editado.'
    )

    // garante que não valida outros campos quando bloqueado
    expect(Object.keys(result)).toHaveLength(1)
  })

  it('deve exigir nome com mínimo 3 caracteres', () => {
    const result = validateBem({
      nome: 'AB',
      numero_patrimonial: '123',
      localizacao: 'Sala',
    })

    expect(result.nome).toBe(
      'Nome deve ter no mínimo 3 caracteres.'
    )
  })

  it('deve exigir número patrimonial obrigatório', () => {
    const result = validateBem({
      nome: 'Mesa',
      numero_patrimonial: '',
      localizacao: 'Sala',
    })

    expect(result.numero_patrimonial).toBe(
      'Número patrimonial é obrigatório.'
    )
  })

  it('deve exigir localização obrigatória', () => {
    const result = validateBem({
      nome: 'Mesa',
      numero_patrimonial: '123',
      localizacao: '',
    })

    expect(result.localizacao).toBe(
      'Localização é obrigatória.'
    )
  })

  it('deve validar valor unitário negativo', () => {
    const result = validateBem({
      nome: 'Mesa',
      numero_patrimonial: '123',
      localizacao: 'Sala',
      valor_unitario: -10,
    })

    expect(result.valor_unitario).toBe(
      'Valor unitário deve ser um número positivo.'
    )
  })

  it('deve validar valor unitário inválido (string não numérica)', () => {
    const result = validateBem({
      nome: 'Mesa',
      numero_patrimonial: '123',
      localizacao: 'Sala',
      valor_unitario: 'abc',
    })

    expect(result.valor_unitario).toBe(
      'Valor unitário deve ser um número positivo.'
    )
  })

  it('não deve validar valor se estiver vazio', () => {
    const result = validateBem({
      nome: 'Mesa',
      numero_patrimonial: '123',
      localizacao: 'Sala',
      valor_unitario: '',
    })

    expect(result.valor_unitario).toBeUndefined()
  })

  it('deve validar descrição mínima se preenchida', () => {
    const result = validateBem({
      nome: 'Mesa',
      numero_patrimonial: '123',
      localizacao: 'Sala',
      descricao: 'abc',
    })

    expect(result.descricao).toBe(
      'Descrição deve ter pelo menos 5 caracteres.'
    )
  })

  it('não deve retornar erros quando dados forem válidos', () => {
    const result = validateBem({
      nome: 'Mesa de Escritório',
      numero_patrimonial: '12345',
      localizacao: 'Sala 101',
      valor_unitario: 1000,
      descricao: 'Mesa nova em perfeito estado',
    })

    expect(result).toEqual({})
  })
})