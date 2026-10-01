import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Network } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { BemCadastroPageShell } from '@/modules/bem-patrimonial/components/BemCadastroPageShell'
import {
  definirCampoValidado,
  limparErroServidor,
} from '@/lib/inline-validation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  movimentacaoSchema,
  type MovimentacaoFormData,
} from '../validators/movimentacao-form.schema'
import { unidadesAdministrativasService } from '@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service'
import { movimentacaoService } from '../services/movimentacao.service'
import type {
  MovimentacaoBemBusca,
  MovimentacaoBuscaBensParams,
  MovimentacaoUoCadastroOption,
} from '../types/movimentacao.types'
import type { UnidadeAdministrativa } from '@/modules/configuracoes/unidades-administrativas/types/unidades-administrativas.types'
import {
  MovimentacaoBensSelection,
  type SelecaoMovimentacao,
} from '../components/MovimentacaoBensSelection'

type UaOption = { id: number; label: string }
type UoOption = { id: number; label: string; tem_ponto_central: boolean }
type ModoBusca = 'geral' | 'faixa' | 'todos'
type CriteriosBusca = Pick<
  MovimentacaoBuscaBensParams,
  'termo_busca' | 'numero_patrimonial_de' | 'numero_patrimonial_ate'
>

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white'
const MENSAGEM_SEM_PONTO_CENTRAL =
  'Não há ponto central cadastrado na Unidade Orçamentária de destino. Por favor, entrar em contato com o gestor.'

function buildUaOptions(
  unidadesAdministrativas: UnidadeAdministrativa[],
  uoId: number | null,
  uaOrigemId: number | null,
): UaOption[] {
  if (!uoId) return []
  return unidadesAdministrativas
    .filter((ua) => ua.unidade_orcamentaria === uoId && ua.id !== uaOrigemId)
    .map((ua) => ({ id: ua.id, label: `${ua.codigo} - ${ua.sigla || ua.nome}` }))
}

function formatarNP(value: string) {
  const digits = value.replaceAll(/\D/g, '').slice(0, 13)
  if (digits.length <= 3) return digits
  if (digits.length <= 12) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 12)}-${digits.slice(12)}`
}

function obterCriteriosBusca(tipo: ModoBusca, termo: string, de: string, ate: string): CriteriosBusca {
  const termoNormalizado = termo.trim()
  if (tipo === 'faixa') {
    const inicio = de.trim()
    const fim = ate.trim()
    if (!inicio) throw new Error('Informe o Número Patrimonial - De.')
    if (fim && inicio > fim) {
      throw new Error('O Número Patrimonial Até deve ser maior ou igual ao Número Patrimonial De.')
    }
    return { numero_patrimonial_de: inicio, ...(fim ? { numero_patrimonial_ate: fim } : {}) }
  }
  if (!termoNormalizado) throw new Error('Informe o critério de busca.')
  return { termo_busca: termoNormalizado }
}

function getUaDestinoPlaceholder(
  selectedUoId: string,
  destinoSemPontoCentral: boolean,
  destinoMesmaUo: boolean,
  hasUaOptions: boolean,
) {
  if (!selectedUoId) return 'Selecione a UO primeiro'
  if (destinoSemPontoCentral) return 'Nenhuma UA'
  if (!destinoMesmaUo) return 'UA definida pelo ponto central'
  if (!hasUaOptions) return 'Nenhuma UA'
  return 'Selecione a UA'
}

function obterIdsBens(selecoes: SelecaoMovimentacao[]) {
  const ids = new Set<number>()
  for (const selecao of selecoes) {
    for (const bem of selecao.bens) ids.add(bem.id)
  }
  return ids
}

export default function AdicionarMovimentacaoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const referenceUoId = user?.uo_ativa?.id ?? null
  const [originUaSelecionada, setOriginUaSelecionada] = useState<number | null>(null)
  const originUaOptions = useMemo(() => (
    user?.opcoes_escopo?.grupos
      .filter((grupo) => grupo.uo.id === referenceUoId)
      .flatMap((grupo) => grupo.uas)
      .map((ua) => ({ id: ua.unidade_administrativa_id, label: ua.label })) ?? []
  ), [referenceUoId, user?.opcoes_escopo?.grupos])
  const originUaId = user?.ua_ativa?.id ?? originUaSelecionada
  const originUaLabel = user?.ua_ativa?.label ?? user?.ua_ativa?.codigo ?? '-'

  useEffect(() => {
    if (!user?.ua_ativa && !originUaSelecionada && originUaOptions.length === 1) {
      setOriginUaSelecionada(originUaOptions[0].id)
    }
  }, [originUaOptions, originUaSelecionada, user?.ua_ativa])

  const form = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    mode: 'onSubmit',
    defaultValues: {
      unidade_orcamentaria_destino: '',
      unidade_administrativa_destino: '',
      observacao: '',
      itens: [],
      destino_mesma_uo: false,
    },
  })

  const selectedUoId = form.watch('unidade_orcamentaria_destino')
  const selectedUaId = form.watch('unidade_administrativa_destino') ?? ''
  const setSelectedUaId = useCallback(
    (value: string) => definirCampoValidado(form, 'unidade_administrativa_destino', value),
    [form],
  )
  const [tipoBusca, setTipoBusca] = useState<ModoBusca>('geral')
  const [termoBusca, setTermoBusca] = useState('')
  const termoBuscaDebounced = useDebouncedValue(termoBusca, 400)
  const [buscaDe, setBuscaDe] = useState('')
  const [buscaAte, setBuscaAte] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<MovimentacaoBemBusca[]>([])
  const [proximaPagina, setProximaPagina] = useState<number | null>(null)
  const [totalResultados, setTotalResultados] = useState(0)
  const [buscaRealizada, setBuscaRealizada] = useState(false)
  const [selecoes, setSelecoes] = useState<SelecaoMovimentacao[]>([])
  const [confirmarSelecionarTodos, setConfirmarSelecionarTodos] = useState(false)
  const versaoBusca = useRef(0)
  const ultimaBuscaGeral = useRef('')
  const modoBuscaAnterior = useRef<ModoBusca>('geral')
  const [buscando, setBuscando] = useState(false)
  const [adicionandoItens, setAdicionandoItens] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uoOptions, setUoOptions] = useState<UoOption[]>([])
  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<UnidadeAdministrativa[]>(
    [],
  )

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      try {
        const options = await movimentacaoService.listOpcoesCadastro()
        if (isMounted) {
          setUoOptions(
            options.map((uo: MovimentacaoUoCadastroOption) => ({
              id: uo.id,
              label: uo.label ?? (uo.codigo && uo.nome ? `${uo.codigo} - ${uo.nome}` : uo.nome),
              tem_ponto_central: uo.tem_ponto_central,
            })),
          )
        }
      } catch {
        if (isMounted) setUoOptions([])
      }
    }

    const loadUnidadesAdministrativas = async () => {
      try {
        const response = await unidadesAdministrativasService.list({ pageSize: 1000 })
        if (isMounted) setUnidadesAdministrativas(response.results)
      } catch {
        if (isMounted) setUnidadesAdministrativas([])
      }
    }

    void loadOptions()
    void loadUnidadesAdministrativas()
    return () => {
      isMounted = false
    }
  }, [])

  const selectedUoNumericId = selectedUoId ? Number(selectedUoId) : null
  const destinoMesmaUo = referenceUoId !== null && selectedUoNumericId === referenceUoId
  const selectedUoOption = useMemo(
    () => uoOptions.find((uo) => uo.id === selectedUoNumericId) ?? null,
    [selectedUoNumericId, uoOptions],
  )
  const destinoSemPontoCentral = Boolean(
    selectedUoNumericId &&
    !destinoMesmaUo &&
    selectedUoOption &&
    !selectedUoOption.tem_ponto_central,
  )
  const uaOptions = useMemo(
    () => buildUaOptions(unidadesAdministrativas, selectedUoNumericId, originUaId),
    [originUaId, selectedUoNumericId, unidadesAdministrativas],
  )
  useEffect(() => {
    if (!selectedUoId && uoOptions.length === 1) {
      form.setValue('unidade_orcamentaria_destino', String(uoOptions[0].id))
    }
  }, [selectedUoId, uoOptions, form])

  useEffect(() => {
    if (destinoMesmaUo && !selectedUaId && uaOptions.length === 1) {
      setSelectedUaId(String(uaOptions[0].id))
    }
  }, [destinoMesmaUo, selectedUaId, uaOptions, setSelectedUaId])

  const bensSelecionados = useMemo(() => {
    const bensPorId = new Map<number, MovimentacaoBemBusca>()
    selecoes.forEach((selecao) => {
      selecao.bens.forEach((bem) => bensPorId.set(bem.id, bem))
    })
    return [...bensPorId.values()]
  }, [selecoes])

  useEffect(() => {
    form.setValue('itens', bensSelecionados.map((bem) => bem.id), {
      shouldValidate: form.formState.isSubmitted,
    })
  }, [bensSelecionados, form])

  useEffect(() => {
    form.setValue('destino_mesma_uo', destinoMesmaUo)
  }, [destinoMesmaUo, form])

  const uaDestinoPlaceholder = getUaDestinoPlaceholder(
    selectedUoId,
    destinoSemPontoCentral,
    destinoMesmaUo,
    uaOptions.length > 0,
  )
  // O botão só é bloqueado por estados que impedem qualquer submissão.
  // Pendências de campo são comunicadas pela validação inline.
  const canSave = !adicionandoItens && !buscando && !submitting

  useEffect(() => {
    if (!destinoMesmaUo || !selectedUoId) {
      if (selectedUaId) setSelectedUaId('')
      return
    }
    if (selectedUaId && !uaOptions.some((ua) => String(ua.id) === selectedUaId)) {
      setSelectedUaId('')
    }
  }, [destinoMesmaUo, selectedUaId, selectedUoId, uaOptions, setSelectedUaId])

  const exibirErro = useCallback(
    (message: string) => {
      form.setError('itens', { message })
      toast.error(message)
    },
    [form],
  )

  const limparErrosDeItens = useCallback(() => {
    form.clearErrors('itens')
    limparErroServidor(form)
  }, [form])

  const limparErroDeServidor = useCallback(() => limparErroServidor(form), [form])

  const limparResultadosBusca = () => {
    versaoBusca.current += 1
    setResultadosBusca([])
    setProximaPagina(null)
    setTotalResultados(0)
    setBuscaRealizada(false)
  }

  const buscarBens = async (pagina = 1, termoGeral = termoBusca) => {
    if (!originUaId) {
      exibirErro('Informe a Unidade Administrativa de origem.')
      return
    }
    let criterios: MovimentacaoBuscaBensParams
    try {
      criterios = {
        unidade_administrativa_origem: originUaId,
        pagina,
        ...obterCriteriosBusca(tipoBusca, termoGeral, buscaDe, buscaAte),
      }
    } catch (error) {
      exibirErro(error instanceof Error ? error.message : 'Informe o critério de busca.')
      return
    }
    const versao = ++versaoBusca.current
    if (tipoBusca === 'geral' && pagina === 1) {
      ultimaBuscaGeral.current = `${originUaId}:${termoGeral.trim()}`
    }
    setBuscando(true)
    limparErrosDeItens()
    try {
      const resposta = await movimentacaoService.buscarBens(criterios)
      if (versao !== versaoBusca.current) return
      setResultadosBusca((atuais) => pagina === 1 ? resposta.itens : [...atuais, ...resposta.itens])
      setProximaPagina(resposta.proxima_pagina)
      setTotalResultados(resposta.count)
      setBuscaRealizada(true)
    } catch (error) {
      if (versao === versaoBusca.current) {
        exibirErro(error instanceof Error ? error.message : 'Não foi possível buscar bens.')
      }
    } finally {
      setBuscando(false)
    }
  }

  const buscarGeralAutomaticamente = useEffectEvent(() => {
    const termo = termoBuscaDebounced.trim()
    const chaveBusca = `${originUaId}:${termo}`
    if (
      tipoBusca !== 'geral' ||
      !originUaId ||
      !termo ||
      ultimaBuscaGeral.current === chaveBusca
    ) return
    void buscarBens(1, termo)
  })

  useEffect(() => {
    buscarGeralAutomaticamente()
  }, [originUaId, termoBuscaDebounced, tipoBusca])

  const alternarBemBusca = (bem: MovimentacaoBemBusca) => {
    if (!bem.apto) return
    setSelecoes((atuais) => {
      const individual = atuais.find(
        (selecao) => selecao.tipo === 'individual' && selecao.bens[0]?.id === bem.id,
      )
      if (individual) return atuais.filter((selecao) => selecao.id !== individual.id)
      const jaSelecionado = obterIdsBens(atuais).has(bem.id)
      if (jaSelecionado) return atuais
      return [...atuais, { id: `bem-${bem.id}`, tipo: 'individual', bens: [bem] }]
    })
    limparErrosDeItens()
  }

  const alternarResultadosBusca = () => {
    const idsBloqueados = new Set(
      selecoes
        .filter((selecao) => selecao.tipo !== 'individual')
        .flatMap((selecao) => selecao.bens.map((bem) => bem.id)),
    )
    const selecionaveis = resultadosBusca.filter((bem) => bem.apto && !idsBloqueados.has(bem.id))
    const idsIndividuais = new Set(
      selecoes
        .filter((selecao) => selecao.tipo === 'individual')
        .flatMap((selecao) => selecao.bens.map((bem) => bem.id)),
    )
    const removerTodos = selecionaveis.length > 0 && selecionaveis.every((bem) => idsIndividuais.has(bem.id))

    setSelecoes((atuais) => {
      const idsResultados = new Set(selecionaveis.map((bem) => bem.id))
      const mantidas = removerTodos
        ? atuais.filter(
            (selecao) => selecao.tipo !== 'individual' || !idsResultados.has(selecao.bens[0].id),
          )
        : atuais
      if (removerTodos) return mantidas
      const idsAtuais = obterIdsBens(mantidas)
      const novas = selecionaveis
        .filter((bem) => !idsAtuais.has(bem.id))
        .map<SelecaoMovimentacao>((bem) => ({ id: `bem-${bem.id}`, tipo: 'individual', bens: [bem] }))
      return [...mantidas, ...novas]
    })
    limparErrosDeItens()
  }

  const importarFaixa = async () => {
    if (!originUaId) {
      exibirErro('Informe a Unidade Administrativa de origem.')
      return
    }
    let faixa: CriteriosBusca
    try {
      faixa = obterCriteriosBusca('faixa', '', buscaDe, buscaAte)
    } catch (error) {
      exibirErro(error instanceof Error ? error.message : 'Informe a faixa de busca.')
      return
    }
    const numeroDe = faixa.numero_patrimonial_de ?? ''
    const numeroAteInformado = faixa.numero_patrimonial_ate
    const numeroAte = numeroAteInformado ?? numeroDe
    if (
      selecoes.some(
        (selecao) =>
          selecao.tipo === 'faixa' &&
          selecao.numeroDe === numeroDe &&
          selecao.numeroAte === numeroAte,
      )
    ) {
      exibirErro('A faixa informada já foi adicionada à movimentação.')
      return
    }

    setAdicionandoItens(true)
    limparErrosDeItens()
    try {
      const { itens } = await movimentacaoService.resolverItensLote({
        unidade_administrativa_origem: originUaId,
        faixas: [{
          numero_patrimonial_de: numeroDe,
          ...(numeroAteInformado ? { numero_patrimonial_ate: numeroAteInformado } : {}),
        }],
      })
      if (itens.length === 0) {
        exibirErro('Nenhum bem apto foi encontrado na faixa informada.')
        return
      }
      const idsAtuais = new Set(bensSelecionados.map((bem) => bem.id))
      if (itens.some((bem) => idsAtuais.has(bem.id))) {
        exibirErro('Um ou mais bens da faixa já foram adicionados à movimentação.')
        return
      }
      const bens = itens.map<MovimentacaoBemBusca>((bem) => ({
        id: bem.id,
        numero_patrimonial: bem.numero_patrimonial,
        nome: bem.nome,
        descricao: bem.descricao ?? '',
        localizacao: bem.localizacao ?? null,
        apto: true,
        motivo: null,
      }))
      setSelecoes((atuais) => [
        ...atuais,
        { id: `faixa-${numeroDe}-${numeroAte}`, tipo: 'faixa', numeroDe, numeroAte, bens },
      ])
      setBuscaDe('')
      setBuscaAte('')
      limparResultadosBusca()
    } catch (requestError: unknown) {
      exibirErro(
        requestError instanceof Error
          ? requestError.message
          : 'Erro ao importar a faixa de bens.',
      )
    } finally {
      setAdicionandoItens(false)
    }
  }

  const handleSelecionarTodos = useCallback(async () => {
      if (!originUaId) {
        exibirErro('Informe a Unidade Administrativa de origem.')
        return
      }

      const versao = ++versaoBusca.current
      setAdicionandoItens(true)
      limparErrosDeItens()
      try {
        const { itens } = await movimentacaoService.resolverItensLote({
          unidade_administrativa_origem: originUaId,
          selecionar_todos: true,
        })
        if (versao !== versaoBusca.current) return
        if (itens.length === 0) {
          exibirErro('Nenhum bem aprovado foi encontrado na unidade administrativa de origem.')
          return
        }
        const selecionados = itens.map<MovimentacaoBemBusca>((bem) => ({
          id: bem.id,
          numero_patrimonial: bem.numero_patrimonial,
          nome: bem.nome,
          descricao: bem.descricao ?? '',
          localizacao: bem.localizacao ?? null,
          apto: true,
          motivo: null,
        }))
        setSelecoes([{ id: 'todos', tipo: 'todos', bens: selecionados }])
        setResultadosBusca(selecionados)
        setTotalResultados(selecionados.length)
        setProximaPagina(null)
        setBuscaRealizada(true)
      } catch (requestError: unknown) {
        if (versao === versaoBusca.current) {
          exibirErro(
            requestError instanceof Error
              ? requestError.message
              : 'Erro ao adicionar itens de movimentação.',
          )
        }
      } finally {
        setAdicionandoItens(false)
      }
    }, [exibirErro, limparErrosDeItens, originUaId])

  const mudarModoBusca = (novoModo: ModoBusca) => {
    const sairDaSelecaoDeTodos = tipoBusca === 'todos' && novoModo !== 'todos'
    modoBuscaAnterior.current = tipoBusca
    setTipoBusca(novoModo)
    ultimaBuscaGeral.current = ''
    limparErrosDeItens()
    limparResultadosBusca()
    if (sairDaSelecaoDeTodos) {
      setSelecoes([])
    }
    if (novoModo !== 'todos') return
    if (selecoes.length > 0) {
      setConfirmarSelecionarTodos(true)
      return
    }
    void handleSelecionarTodos()
  }

  const handleSave = form.handleSubmit(async (values) => {
    if (!originUaId) {
      form.setError('root.serverError', {
        message: 'Unidade Administrativa de origem não informada.',
      })
      return
    }
    if (destinoSemPontoCentral) {
      form.setError('unidade_orcamentaria_destino', { message: MENSAGEM_SEM_PONTO_CENTRAL })
      return
    }

    const selectedUoNumericId = Number(values.unidade_orcamentaria_destino)

    const selecaoPayload = selecoes.length === 1 && selecoes[0].tipo === 'todos'
      ? { selecionar_todos: true }
      : { itens: bensSelecionados.map((bem) => ({ bem: bem.id })) }

    setSubmitting(true)
    try {
      await movimentacaoService.create({
        unidade_administrativa_origem: originUaId,
        unidade_orcamentaria_destino: selectedUoNumericId,
        observacao: values.observacao ?? '',
        ...selecaoPayload,
        ...(destinoMesmaUo
          ? { unidade_administrativa_destino: Number(values.unidade_administrativa_destino) }
          : {}),
      })
      toast.success(
        'Cadastro realizado com sucesso - A movimentação do bem foi cadastrada e enviada para aprovação.',
      )
      navigate('/movimentacoes')
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : 'Erro ao salvar movimentação.'
      form.setError('root.serverError', { message })
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  })

  const buscaGridClass = tipoBusca === 'geral'
    ? 'grid gap-3 md:grid-cols-[minmax(0,36rem)_auto] md:items-end md:justify-start'
    : 'grid gap-3 md:grid-cols-[1fr_auto] md:items-end'

  return (
    <BemCadastroPageShell
      breadcrumbItems={[
        { label: 'Bem Patrimonial', icon: Network },
        { label: 'Movimentações de Bem Patrimonial', to: '/movimentacoes' },
        { label: 'Adicionar Movimentação de Bem Patrimonial', isActive: true },
      ]}
      title='Adicionar Movimentação de Bem Patrimonial'
      onCancel={() => navigate('/movimentacoes')}
      onSave={handleSave}
      canSave={canSave}
      submitting={submitting}
      error={form.formState.errors.root?.serverError?.message ?? null}
    >
      <Form {...form}>
      <div className='flex flex-col gap-2'>
        <label htmlFor='ua-origem' className='text-sm font-semibold text-gray-700'>
          Unidade Administrativa de Origem
        </label>
        {user?.ua_ativa ? (
          <Input id='ua-origem' value={originUaLabel} disabled className={`${INPUT_CLASS} bg-gray-50 text-gray-500 cursor-not-allowed`} />
        ) : (
          <Select value={originUaId ? String(originUaId) : ''} onValueChange={(value) => {
            versaoBusca.current += 1
            setOriginUaSelecionada(Number(value))
            setSelecoes([])
            limparResultadosBusca()
            setTipoBusca('geral')
            form.clearErrors('itens')
          }}>
            <SelectTrigger id='ua-origem' className={INPUT_CLASS}><SelectValue placeholder='Selecione a UA de origem' /></SelectTrigger>
            <SelectContent>
              {originUaOptions.map((ua) => <SelectItem key={ua.id} value={String(ua.id)}>{ua.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='unidade_orcamentaria_destino'
          render={({ field, fieldState }) => (
          <FormItem className='flex flex-col gap-2'>
            <FormLabel className='text-sm font-semibold text-gray-700' htmlFor='uo-destino'>
              Unidade Orçamentária de Destino
            </FormLabel>
          <Select
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value)
              limparErroDeServidor()
            }}
          >
            <FormControl>
            <SelectTrigger id='uo-destino' className={INPUT_CLASS} aria-invalid={!!fieldState.error}>
              <SelectValue placeholder='Selecione a UO de destino' />
            </SelectTrigger>
            </FormControl>
            <SelectContent>
              {uoOptions.length === 0 ? (
                <SelectItem value='__empty__' disabled>
                  Nenhuma UO disponível
                </SelectItem>
              ) : (
                uoOptions.map((uo) => (
                  <SelectItem key={uo.id} value={String(uo.id)}>
                    {uo.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
            <FormMessage />
          </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='unidade_administrativa_destino'
          render={({ field, fieldState }) => (
          <FormItem className='flex flex-col gap-2'>
            <FormLabel className='text-sm font-semibold text-gray-700' htmlFor='ua-destino'>
              Unidade Administrativa de Destino
            </FormLabel>
          <Select
            value={field.value ?? ''}
            onValueChange={(value) => {
              field.onChange(value)
              limparErroDeServidor()
            }}
            disabled={!selectedUoId || !destinoMesmaUo}
          >
            <FormControl>
            <SelectTrigger id='ua-destino' className={INPUT_CLASS} aria-invalid={!!fieldState.error}>
              <SelectValue placeholder={uaDestinoPlaceholder} />
            </SelectTrigger>
            </FormControl>
            <SelectContent>
              {uaOptions.length === 0 ? (
                <SelectItem value='__empty__' disabled>
                  Nenhuma UA
                </SelectItem>
              ) : (
                uaOptions.map((ua) => (
                  <SelectItem key={ua.id} value={String(ua.id)}>
                    {ua.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
            <FormMessage />
          </FormItem>
          )}
        />
      </div>

      {destinoSemPontoCentral ? (
        <div
          className='rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800'
          role='alert'
        >
          {MENSAGEM_SEM_PONTO_CENTRAL}
        </div>
      ) : null}

      <FormField
        control={form.control}
        name='observacao'
        render={({ field }) => (
          <FormItem className='flex flex-col gap-2'>
            <FormLabel className='text-sm font-semibold text-gray-700' htmlFor='observacao'>
              Observação
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                id='observacao'
                onChange={(event) => {
                  field.onChange(event)
                  limparErroDeServidor()
                }}
                placeholder='Digite uma observação'
                className='min-h-28'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <section className='space-y-3' aria-labelledby='itens-movimentacao'>
        <FormField
          control={form.control}
          name='itens'
          render={() => (
            <FormItem>
              <FormLabel asChild>
                <h2
                  id='itens-movimentacao'
                  className='text-sm font-semibold text-[#00703C] data-[error=true]:text-destructive'
                >
                  Itens de Movimentação
                </h2>
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='space-y-5'>
          <fieldset className='flex flex-wrap gap-5' aria-label='Modo de busca de bens'>
            {([['geral', 'Buscar Geral'], ['faixa', 'Buscar Faixa'], ['todos', 'Todos os bens da UA']] as const).map(([valor, label]) => (
              <label key={valor} className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                <input
                  type='radio'
                  name='modo-busca-bens'
                  value={valor}
                  checked={tipoBusca === valor}
                  disabled={buscando || adicionandoItens}
                  onChange={() => mudarModoBusca(valor)}
                  className='accent-[#2F7D57]'
                />
                {label}
              </label>
            ))}
          </fieldset>

          {tipoBusca === 'todos' ? null : (
            <div className={buscaGridClass}>
              {tipoBusca === 'faixa' ? (
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <label htmlFor='busca-np-de' className='text-sm font-semibold text-gray-700'>Número Patrimonial - De</label>
                    <Input
                      id='busca-np-de'
                      value={buscaDe}
                      onChange={(event) => { setBuscaDe(formatarNP(event.target.value)); limparResultadosBusca() }}
                      placeholder='000.000000000-0'
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label htmlFor='busca-np-ate' className='text-sm font-semibold text-gray-700'>Número Patrimonial - Até</label>
                    <Input
                      id='busca-np-ate'
                      value={buscaAte}
                      onChange={(event) => { setBuscaAte(formatarNP(event.target.value)); limparResultadosBusca() }}
                      placeholder='000.000000000-0'
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <label htmlFor='termo-busca-bem' className='text-sm font-semibold text-gray-700'>Buscar por nome, descrição, ID ou número patrimonial</label>
                  <Input
                    id='termo-busca-bem'
                    value={termoBusca}
                    onChange={(event) => {
                      ultimaBuscaGeral.current = ''
                      setTermoBusca(event.target.value)
                      limparResultadosBusca()
                    }}
                    className={INPUT_CLASS}
                  />
                </div>
              )}
              <Button
                type='button'
                onClick={() => void buscarBens()}
                disabled={buscando || adicionandoItens}
                className='h-10 bg-[#2F7D57] px-5 font-semibold text-white hover:bg-[#256947]'
              >
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          )}

          <MovimentacaoBensSelection
            resultados={resultadosBusca}
            selecoes={selecoes}
            buscaRealizada={buscaRealizada}
            totalResultados={totalResultados}
            buscando={buscando || adicionandoItens}
            proximaPagina={proximaPagina}
            permiteImportarFaixa={tipoBusca === 'faixa'}
            permiteSelecionarResultados={tipoBusca === 'geral'}
            onAlternarBem={alternarBemBusca}
            onAlternarResultados={alternarResultadosBusca}
            onImportarFaixa={() => void importarFaixa()}
            onCarregarMais={(pagina) => void buscarBens(pagina)}
            onRemoverSelecao={(id) => {
              setSelecoes((atuais) => atuais.filter((selecao) => selecao.id !== id))
              limparErrosDeItens()
            }}
          />
        </div>
      </section>
      </Form>
      <ConfirmDialog
        open={confirmarSelecionarTodos}
        title='Selecionar todos os bens da UA'
        message='A lista de bens selecionados será substituída por todos os bens aptos da Unidade Administrativa de origem. Deseja continuar?'
        confirmLabel='Continuar'
        loading={adicionandoItens}
        onConfirm={() => {
          setConfirmarSelecionarTodos(false)
          void handleSelecionarTodos()
        }}
        onClose={() => {
          setConfirmarSelecionarTodos(false)
          setTipoBusca(modoBuscaAnterior.current)
        }}
      />
    </BemCadastroPageShell>
  )
}
