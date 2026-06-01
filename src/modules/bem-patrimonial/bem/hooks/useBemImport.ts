import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { bemService, type ImportacaoResultado } from '../services/bem.service'

export interface ImportacaoErroLinha {
  linha: number
  numero_patrimonial: string
  campo: string
  tipo_erro: string
}

// Ponto 2: removido 'erro_parcial' — a regra é tudo ou nada.
// Qualquer resposta que não seja 201 é tratada como falha total.
type ImportacaoEstado =
  | { tipo: 'idle' }
  | { tipo: 'arquivo_selecionado'; arquivo: File }
  | { tipo: 'importando' }
  | { tipo: 'sucesso'; resultado: ImportacaoResultado }
  | { tipo: 'erro_total'; erros: ImportacaoErroLinha[]; detail: string }
  | { tipo: 'erro_request'; mensagem: string }

/**
 * Ponto 5: converte a lista de erros padronizados do backend para o formato da UI.
 * Estrutura recebida: { linha, numero_patrimonial, campo, mensagem }
 * numero_patrimonial vem como "-" quando ausente (garantido pelo backend).
 */
function parseErrosPorLinha(
  raw: { linha: number; numero_patrimonial: string; campo: string; mensagem: string }[]
): ImportacaoErroLinha[] {
  return raw.map(item => ({
    linha: item.linha,
    numero_patrimonial: item.numero_patrimonial || '-',
    campo: item.campo,
    tipo_erro: `${item.campo}: ${item.mensagem}`,
  }))
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

      // 422: carga rejeitada com erros padronizados
      if (status === 422) {
        const erros = parseErrosPorLinha(data.erros_por_linha ?? [])
        setEstado({ tipo: 'erro_total', erros, detail: data.detail })
        return
      }

      // 403: usuário sem UA ou UA inativa
      if (status === 403) {
        setEstado({
          tipo: 'erro_request',
          mensagem: data.detail ?? 'Sem permissão para importar.',
        })
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

      // Ponto 2: qualquer outro status inesperado é falha total — sem importação parcial.
      setEstado({
        tipo: 'erro_request',
        mensagem: data.detail ?? 'Erro desconhecido. Nenhum bem foi importado.',
      })
    } catch (err) {
      setEstado({
        tipo: 'erro_request',
        mensagem:
          err instanceof Error
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