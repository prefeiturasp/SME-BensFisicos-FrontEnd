import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { bemService, type ImportacaoResultado } from '../services/bem.service'

export interface ImportacaoErroLinha {
  linha: number
  numero_patrimonial: string
  tipo_erro: string
}

type ImportacaoEstado =
  | { tipo: 'idle' }
  | { tipo: 'arquivo_selecionado'; arquivo: File }
  | { tipo: 'importando' }
  | { tipo: 'sucesso'; resultado: ImportacaoResultado }
  | { tipo: 'erro_parcial'; resultado: ImportacaoResultado; erros: ImportacaoErroLinha[] }
  | { tipo: 'erro_total'; erros: ImportacaoErroLinha[]; detail: string }
  | { tipo: 'erro_request'; mensagem: string }

/**
 * Converte as strings de erro do backend para o formato tabular da UI.
 * Formato recebido: "Linha 5 | Número Patrimonial: 001.000000001-0 | Erro: Duplicado"
 */
function parseErrosPorLinha(raw: string[]): ImportacaoErroLinha[] {
  return raw.map(msg => {
    const partes = msg.split(' | ')
    const linha = parseInt(partes[0]?.replace('Linha ', '') ?? '0', 10) || 0
    const numero = partes[1]?.replace('Número Patrimonial: ', '').trim() ?? '-'
    const tipo = partes[2]?.replace('Erro: ', '').trim() ?? msg
    return { linha, numero_patrimonial: numero, tipo_erro: tipo }
  })
}

function parseErrosCampos(
  raw: { linha: number; erros: Record<string, string[]> }[]
): ImportacaoErroLinha[] {
  return raw.flatMap(item =>
    Object.entries(item.erros).map(([campo, msgs]) => ({
      linha: item.linha,
      numero_patrimonial: '-',
      tipo_erro: `${campo}: ${msgs.join(', ')}`,
    }))
  )
}

export function useBemImport() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<ImportacaoEstado>({ tipo: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  const arquivo =
    estado.tipo === 'arquivo_selecionado' ? estado.arquivo : null
  const importando = estado.tipo === 'importando'

  const selecionarArquivo = (file: File) => {
    setEstado({ tipo: 'arquivo_selecionado', arquivo: file })
  }

  const removerArquivo = () => {
    setEstado({ tipo: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  const novoUpload = () => {
    setEstado({ tipo: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
    setTimeout(() => inputRef.current?.click(), 50)
  }

  const importar = async () => {
    if (estado.tipo !== 'arquivo_selecionado') return

    setEstado({ tipo: 'importando' })

    try {
      const { status, data } = await bemService.importar(estado.arquivo)

      // 201: tudo importado sem erros
      if (status === 201) {
        setEstado({ tipo: 'sucesso', resultado: data })
        return
      }

      // 207: parcial — alguns importados, alguns com erro
      if (status === 207) {
        const erros = [
          ...parseErrosPorLinha(data.erros_por_linha ?? []),
          ...parseErrosCampos(data.erros_campos ?? []),
        ]
        setEstado({ tipo: 'erro_parcial', resultado: data, erros })
        return
      }

      // 422: nada importado, tudo com erro
      if (status === 422) {
        const erros = [
          ...parseErrosPorLinha(data.erros_por_linha ?? []),
          ...parseErrosCampos(data.erros_campos ?? []),
        ]
        setEstado({ tipo: 'erro_total', erros, detail: data.detail })
        return
      }

      // 403: usuário sem UA ou UA inativa
      if (status === 403) {
        setEstado({ tipo: 'erro_request', mensagem: data.detail ?? 'Sem permissão para importar.' })
        return
      }

      // 400: arquivo inválido (formato, tamanho)
      if (status === 400) {
        const errosArquivo = (data as any)?.erros?.arquivo ?? []
        setEstado({
          tipo: 'erro_request',
          mensagem: errosArquivo.length
            ? errosArquivo.join(' ')
            : (data.detail ?? 'Arquivo inválido.'),
        })
        return
      }

      setEstado({ tipo: 'erro_request', mensagem: data.detail ?? 'Erro desconhecido.' })
    } catch (err) {
      setEstado({
        tipo: 'erro_request',
        mensagem: err instanceof Error
          ? err.message
          : 'Não foi possível conectar ao servidor. Tente novamente.',
      })
    }
  }

  const cancelar = () => navigate('/bens-patrimoniais')

  return {
    estado,
    arquivo,
    importando,
    inputRef,
    selecionarArquivo,
    removerArquivo,
    novoUpload,
    importar,
    cancelar,
  }
}