import { useEffect, useState } from 'react'

interface NumeroPatrimonialProps {
  valor: string
  formatoAntigoInicial: boolean
  semNumeracaoInicial: boolean
}

export function useNumeroPatrimonial({
  valor,
  formatoAntigoInicial,
  semNumeracaoInicial
}: NumeroPatrimonialProps) {
  const [formatoAntigo, setFormatoAntigo] = useState(false)
  const [semNumeracao, setSemNumeracao] = useState(false)

  useEffect(() => {
    let sem = semNumeracaoInicial
    let formato = formatoAntigoInicial

    if (sem && formato) {
      sem = false
    }

    setFormatoAntigo(formato)
    setSemNumeracao(sem)
  }, [formatoAntigoInicial, semNumeracaoInicial])

  function onlyDigits(str: string) {
    return (str || '').replace(/\D/g, '')
  }

  function formatNovoPadrao(digits: string) {
    const d = digits.slice(0, 13)
    const p1 = d.slice(0, 3)
    const p2 = d.slice(3, 12)
    const p3 = d.slice(12, 13)

    if (d.length <= 3) return p1
    if (d.length <= 12) return `${p1}.${p2}`
    return `${p1}.${p2}-${p3}`
  }

  function applyMask(input: string) {
    if (formatoAntigo) return input
    return formatNovoPadrao(onlyDigits(input))
  }

  function ativarFormatoAntigo() {
    setFormatoAntigo(true)
    setSemNumeracao(false)
  }

  function desativarFormatoAntigo() {
    setFormatoAntigo(false)
  }

  function handleSemNumeracaoChange(checked: boolean) {
    if (checked) {
      setFormatoAntigo(false)
    }
    setSemNumeracao(checked)
  }

  const disabled = semNumeracao && !formatoAntigo

  return {
    formatoAntigo,
    semNumeracao,
    disabled,
    applyMask,
    ativarFormatoAntigo,
    desativarFormatoAntigo,
    handleSemNumeracaoChange,
  }
}
