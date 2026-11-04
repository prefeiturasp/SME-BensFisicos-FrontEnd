import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNumeroPatrimonial } from '../useNumeroPatrimonial'

describe('useNumeroPatrimonial', () => {

  // ===============================
  // INICIALIZAÇÃO
  // ===============================

  it('deve iniciar com valores recebidos', () => {
    const { result } = renderHook(() =>
      useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: true,
        semNumeracaoInicial: false,
      })
    )

    expect(result.current.formatoAntigo).toBe(true)
    expect(result.current.semNumeracao).toBe(false)
  })

  it('não deve permitir formatoAntigo e semNumeracao juntos', () => {
    const { result } = renderHook(() =>
      useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: true,
        semNumeracaoInicial: true,
      })
    )

    expect(result.current.formatoAntigo).toBe(true)
    expect(result.current.semNumeracao).toBe(false)
  })

  // ===============================
  // APPLY MASK
  // ===============================

  it('deve aplicar máscara no novo padrão', () => {
    const { result } = renderHook(() =>
      useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: false,
        semNumeracaoInicial: false,
      })
    )

    const masked = result.current.applyMask('1234567890123')

    expect(masked).toBe('123.456789012-3')
  })

  it('deve remover caracteres não numéricos', () => {
    const { result } = renderHook(() =>
      useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: false,
        semNumeracaoInicial: false,
      })
    )

    const masked = result.current.applyMask('123abc456')

    expect(masked).toBe('123.456')
  })

  it('não deve aplicar máscara se formatoAntigo for true', () => {
    const { result } = renderHook(() =>
      useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: true,
        semNumeracaoInicial: false,
      })
    )

    const masked = result.current.applyMask('abc123')

    expect(masked).toBe('abc123')
  })

  // ===============================
  // HANDLE FORMATO ANTIGO
  // ===============================

  it('deve ativar formatoAntigo e desativar semNumeracao', () => {
  const { result } = renderHook(() =>
    useNumeroPatrimonial({
      valor: '',
      formatoAntigoInicial: false,
      semNumeracaoInicial: true,
    })
  )

  act(() => {
    result.current.ativarFormatoAntigo()
  })

  expect(result.current.formatoAntigo).toBe(true)
  expect(result.current.semNumeracao).toBe(false)
    })

  it('deve desativar formatoAntigo', () => {
    const { result } = renderHook(() =>
        useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: true,
        semNumeracaoInicial: false,
        })
    )

    act(() => {
        result.current.desativarFormatoAntigo()
    })

    expect(result.current.formatoAntigo).toBe(false)
    })

  

  // ===============================
  // DISABLED
  // ===============================

  it('deve retornar disabled quando semNumeracao for true e formatoAntigo false', () => {
    const { result } = renderHook(() =>
      useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: false,
        semNumeracaoInicial: true,
      })
    )

    expect(result.current.disabled).toBe(true)
  })

  it('não deve retornar disabled quando formatoAntigo for true', () => {
    const { result } = renderHook(() =>
      useNumeroPatrimonial({
        valor: '',
        formatoAntigoInicial: true,
        semNumeracaoInicial: false,
      })
    )

    expect(result.current.disabled).toBe(false)
  })

  // ===============================
  // RE-RENDER COM NOVAS PROPS
  // ===============================

  it('deve reagir a mudanças nas props', () => {
    const { result, rerender } = renderHook(
      props => useNumeroPatrimonial(props),
      {
        initialProps: {
          valor: '',
          formatoAntigoInicial: false,
          semNumeracaoInicial: false,
        },
      }
    )

    expect(result.current.formatoAntigo).toBe(false)

    rerender({
      valor: '',
      formatoAntigoInicial: true,
      semNumeracaoInicial: false,
    })

    expect(result.current.formatoAntigo).toBe(true)
  })

})