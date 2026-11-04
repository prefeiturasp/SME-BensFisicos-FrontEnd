import { describe, it, expect } from 'vitest'
import { getBemStatusTone } from '../status'

describe('getBemStatusTone — laudado_para_baixa', () => {
  it('mapeia laudado_para_baixa para neutral (mesmo tom de baixa_fisica)', () => {
    expect(getBemStatusTone('laudado_para_baixa')).toBe('neutral')
    expect(getBemStatusTone('baixa_fisica')).toBe('neutral')
  })

  it('mantém tons existentes', () => {
    expect(getBemStatusTone('aprovado')).toBe('success')
    expect(getBemStatusTone('aguardando_aprovacao')).toBe('pending')
  })

  it('retorna neutral para status desconhecido', () => {
    expect(getBemStatusTone('status_inexistente')).toBe('neutral')
  })
})
