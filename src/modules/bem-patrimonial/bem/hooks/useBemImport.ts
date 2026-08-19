import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/auth/useAuth'
import { bemService, type ImportacaoResultado } from '../services/bem.service'
import {
  ehErroDeConciliacao,
  MENSAGEM_CONCILIACAO_EM_ABERTO,
} from '../utils/conciliacao-erro'

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
  const { user } = useAuth()
  const [estado, setEstado] = useState<ImportacaoEstado>({ tipo: 'idle' })
  const [uaSelecionadaId, setUaSelecionadaId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Usuário está logado numa UA específica quando ua_ativa está preenchida.
  // Caso contrário (uo_ativa preenchida, ua_ativa nula) opera no nível de UO e
  // precisa escolher a UA de destino.
  const estaEmUa = !!user?.ua_ativa
  const precisaSelecionarUa = !estaEmUa && !!user?.uo_ativa

  // UAs disponíveis para escolha quando logado numa UO: as UAs do grupo cuja
  // UO corresponde à UO ativa do usuário (opcoes_escopo).
  const uasDisponiveis = useMemo(() => {
    if (!precisaSelecionarUa) return []
    const grupos = user?.opcoes_escopo?.grupos ?? []
    const uoAtivaId = user?.uo_ativa?.id
    const grupo =
      grupos.find((g) => g.uo.id === uoAtivaId) ?? grupos[0]
    return (grupo?.uas ?? []).map((ua) => ({
      id: ua.unidade_administrativa_id,
      label: ua.label ?? ua.nome,
    }))
  }, [precisaSelecionarUa, user?.opcoes_escopo?.grupos, user?.uo_ativa?.id])

  // Pré-seleciona automaticamente quando há exatamente uma UA disponível.
  // Isso evita o caso em que o usuário vê a única UA no campo mas o valor não
  // chega a ser efetivamente selecionado (estado permaneceria nulo), levando o
  // backend a recusar a importação por "UA não vinculada".
  useEffect(() => {
    if (
      precisaSelecionarUa &&
      uaSelecionadaId == null &&
      uasDisponiveis.length === 1
    ) {
      setUaSelecionadaId(uasDisponiveis[0].id)
    }
  }, [precisaSelecionarUa, uaSelecionadaId, uasDisponiveis])

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

    // Quando o usuário opera no nível de UO, a UA de destino é obrigatória.
    if (precisaSelecionarUa && uaSelecionadaId == null) {
      toast.error('Importação não realizada', {
        description: 'Selecione a Unidade Administrativa de destino.',
      })
      return
    }

    // UA enviada ao backend: a escolhida (quando em UO) ou nenhuma (quando em
    // UA, o backend usa a UA do próprio usuário).
    const uaId = precisaSelecionarUa ? uaSelecionadaId : null

    setEstado({ tipo: 'importando' })

    try {
      const { status, data } = await bemService.importar(estado.arquivo, uaId)

      // 201: tudo importado sem erros
      if (status === 201) {
        setEstado({ tipo: 'sucesso', resultado: data })
        return
      }

      // Qualquer erro relacionado a Conciliação — independente do status
      // HTTP retornado (403, 409, 422, 500, etc.) — deve ser comunicado ao
      // usuário com a mensagem padronizada de negócio, prevalecendo sobre
      // as demais regras de mapeamento de erro abaixo.
      if (ehErroDeConciliacao(data)) {
        setEstado({
          tipo: 'erro_request',
          mensagem: MENSAGEM_CONCILIACAO_EM_ABERTO,
        })
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

      // 409: bloqueado por regra de negócio — ex.: Conciliação em aberto
      // para a Unidade Administrativa/Orçamentária do usuário.
      // Mensagem fixa (não usa data.detail): o título do toast já é
      // "Importação não realizada", então usar um detail que repete esse
      // início duplica a frase na tela.
      if (status === 409) {
        setEstado({
          tipo: 'erro_request',
          mensagem: 'Existe Conciliação em aberto.',
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
    // Seleção de Unidade Administrativa (usuário logado numa UO)
    precisaSelecionarUa,
    uasDisponiveis,
    uaSelecionadaId,
    setUaSelecionadaId,
  }
}