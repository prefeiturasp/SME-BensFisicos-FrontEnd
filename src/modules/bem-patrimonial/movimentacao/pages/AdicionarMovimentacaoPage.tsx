import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Network } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

type UaOption = { id: number; label: string }
type UoOption = { id: number; label: string; tem_ponto_central: boolean }
type ModoBusca = 'geral' | 'faixa' | 'todos'
type CriteriosBusca = Pick<MovimentacaoBuscaBensParams, 'q' | 'numero_patrimonial_de' | 'numero_patrimonial_ate'>
type EstadoBusca = {
  selecionados: MovimentacaoBemBusca[]
  resultados: MovimentacaoBemBusca[]
  proximaPagina: number | null
  total: number
  realizada: boolean
  carregado: boolean
  selecionarTodos: boolean
}

function novoEstadoBusca(): EstadoBusca {
  return { selecionados: [], resultados: [], proximaPagina: null, total: 0, realizada: false, carregado: false, selecionarTodos: false }
}

function novosEstadosBusca(): Record<ModoBusca, EstadoBusca> {
  return { geral: novoEstadoBusca(), faixa: novoEstadoBusca(), todos: novoEstadoBusca() }
}

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
  return { q: termoNormalizado }
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

type BuscaBensPanelProps = Readonly<{
  tipo: ModoBusca
  onTipoChange: (tipo: ModoBusca) => void
  termo: string
  onTermoChange: (value: string) => void
  de: string
  onDeChange: (value: string) => void
  ate: string
  onAteChange: (value: string) => void
  buscando: boolean
  onBuscar: (pagina?: number) => void
  buscaRealizada: boolean
  total: number
  resultados: MovimentacaoBemBusca[]
  selecionados: MovimentacaoBemBusca[]
  proximaPagina: number | null
  onAlternarBem: (bem: MovimentacaoBemBusca) => void
}>

function BuscaBensPanel({
  tipo, onTipoChange, termo, onTermoChange, de, onDeChange, ate, onAteChange,
  buscando, onBuscar, buscaRealizada, total, resultados, selecionados,
  proximaPagina, onAlternarBem,
}: BuscaBensPanelProps) {
  const idsSelecionados = new Set(selecionados.map((bem) => bem.id))
  const itensTabela = [...selecionados, ...resultados.filter((bem) => !idsSelecionados.has(bem.id))]
  return (
    <div className='space-y-3'>
      <fieldset className='flex flex-wrap gap-4' aria-label='Modo de seleção de bens'>
        {([['geral', 'Buscar Geral'], ['faixa', 'Buscar Faixa'], ['todos', 'Todos os bens da UA']] as const).map(([valor, label]) => (
          <label key={valor} className='flex items-center gap-2 text-sm font-medium text-gray-700'>
            <input type='radio' name='modo-busca-bens' value={valor} checked={tipo === valor} disabled={buscando} onChange={() => onTipoChange(valor)} className='accent-[#2F7D57]' />
            {label}
          </label>
        ))}
      </fieldset>
      {tipo === 'todos' ? null : (
        <div className='grid gap-3 md:grid-cols-[1fr_auto] md:items-end'>
          {tipo === 'faixa' ? (
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <label htmlFor='busca-np-de' className='text-sm font-semibold text-gray-700'>Número Patrimonial - De</label>
                <Input id='busca-np-de' value={de} onChange={(event) => onDeChange(formatarNP(event.target.value))} placeholder='000.000000000-0' className={INPUT_CLASS} />
              </div>
              <div className='space-y-2'>
                <label htmlFor='busca-np-ate' className='text-sm font-semibold text-gray-700'>Número Patrimonial - Até</label>
                <Input id='busca-np-ate' value={ate} onChange={(event) => onAteChange(formatarNP(event.target.value))} placeholder='000.000000000-0' className={INPUT_CLASS} />
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              <label htmlFor='termo-busca-bem' className='text-sm font-semibold text-gray-700'>Buscar por nome, descrição, ID ou número patrimonial</label>
              <Input id='termo-busca-bem' value={termo} onChange={(event) => onTermoChange(event.target.value)} className={INPUT_CLASS} />
            </div>
          )}
          <Button type='button' variant='outline' onClick={() => onBuscar()} disabled={buscando}>
            {buscando ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      )}
      {buscaRealizada && total === 0 ? <p className='text-sm text-gray-500'>Nenhum bem encontrado para a busca informada.</p> : null}
      <div className='overflow-x-auto rounded-md border border-gray-200'>
        <table className='w-full min-w-190 text-sm'>
          <thead className='border-b bg-[#F5F5F5] text-left text-gray-700'><tr><th className='p-3'>Selecionar</th><th className='p-3'>ID</th><th className='p-3'>Número Patrimonial</th><th className='p-3'>Nome</th><th className='p-3'>Descrição</th><th className='p-3'>Localização</th><th className='p-3'>Situação</th></tr></thead>
          <tbody>{itensTabela.map((bem) => (
            <tr key={bem.id} className='border-b hover:bg-gray-50'>
              <td className='p-3'><Checkbox aria-label={`Selecionar bem ID ${bem.id}`} checked={idsSelecionados.has(bem.id)} disabled={!bem.apto && !idsSelecionados.has(bem.id)} onCheckedChange={() => onAlternarBem(bem)} /></td>
              <td className='p-3'>{bem.id}</td><td className='p-3'>{bem.numero_patrimonial ?? 'Sem número patrimonial'}</td>
              <td className='p-3'>{bem.nome}</td><td className='p-3'>{bem.descricao}</td><td className='p-3'>{bem.localizacao || '-'}</td>
              <td className='p-3'>{bem.motivo ?? 'Apto para movimentação'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {proximaPagina ? <Button type='button' variant='outline' onClick={() => onBuscar(proximaPagina)} disabled={buscando}>Carregar mais</Button> : null}
    </div>
  )
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
  const [buscaDe, setBuscaDe] = useState('')
  const [buscaAte, setBuscaAte] = useState('')
  const [buscas, setBuscas] = useState(novosEstadosBusca)
  const versaoBusca = useRef(0)
  const buscaAtiva = buscas[tipoBusca]
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

  useEffect(() => {
    form.setValue('itens', buscaAtiva.selecionados.map((bem) => bem.id), {
      shouldValidate: form.formState.isSubmitted,
    })
  }, [buscaAtiva.selecionados, form])

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

  const atualizarBusca = (modo: ModoBusca, alterar: (atual: EstadoBusca) => EstadoBusca) => {
    setBuscas((atuais) => ({ ...atuais, [modo]: alterar(atuais[modo]) }))
  }

  const limparResultadosBusca = (modo: ModoBusca) => {
    versaoBusca.current += 1
    atualizarBusca(modo, (atual) => ({
      ...atual, resultados: [], proximaPagina: null, total: 0, realizada: false,
    }))
  }

  const buscarBens = async (pagina = 1) => {
    if (!originUaId) return
    const modo = tipoBusca
    let criterios: MovimentacaoBuscaBensParams
    try {
      criterios = {
        unidade_administrativa_origem: originUaId,
        pagina,
        ...obterCriteriosBusca(tipoBusca, termoBusca, buscaDe, buscaAte),
      }
    } catch (error) {
      exibirErro(error instanceof Error ? error.message : 'Informe o critério de busca.')
      return
    }
    const versao = ++versaoBusca.current
    setBuscando(true)
    limparErrosDeItens()
    try {
      const resposta = await movimentacaoService.buscarBens(criterios)
      if (versao !== versaoBusca.current) return
      atualizarBusca(modo, (atual) => ({
        ...atual,
        resultados: pagina === 1 ? resposta.itens : [...atual.resultados, ...resposta.itens],
        proximaPagina: resposta.proxima_pagina,
        total: resposta.count,
        realizada: true,
      }))
    } catch (error) {
      if (versao === versaoBusca.current) {
        exibirErro(error instanceof Error ? error.message : 'Não foi possível buscar bens.')
      }
    } finally {
      setBuscando(false)
    }
  }

  const alternarBemBusca = (bem: MovimentacaoBemBusca) => {
    if (!bem.apto && !buscaAtiva.selecionados.some((item) => item.id === bem.id)) return
    atualizarBusca(tipoBusca, (atual) => ({
      ...atual,
      selecionados: atual.selecionados.some((item) => item.id === bem.id)
        ? atual.selecionados.filter((item) => item.id !== bem.id)
        : [...atual.selecionados, bem],
      selecionarTodos: false,
    }))
    limparErrosDeItens()
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
        const selecionados = itens.map((bem) => ({
          id: bem.id,
          numero_patrimonial: bem.numero_patrimonial,
          nome: bem.nome,
          descricao: bem.descricao ?? '',
          localizacao: bem.localizacao ?? null,
          apto: true,
          motivo: null,
        }))
        setBuscas((atuais) => ({
          ...atuais,
          todos: { ...atuais.todos, selecionados, resultados: selecionados, selecionarTodos: true, carregado: true },
        }))
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
    setTipoBusca(novoModo)
    limparErrosDeItens()
    if (novoModo === 'todos' && !buscas.todos.carregado) {
      void handleSelecionarTodos()
    }
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

    const selecaoPayload = buscaAtiva.selecionarTodos
      ? { selecionar_todos: true }
      : { itens: buscaAtiva.selecionados.map((bem) => ({ bem: bem.id })) }

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
            setBuscas(novosEstadosBusca())
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
        <BuscaBensPanel
          tipo={tipoBusca}
          onTipoChange={mudarModoBusca}
          termo={termoBusca}
          onTermoChange={(value) => { setTermoBusca(value); limparResultadosBusca('geral') }}
          de={buscaDe}
          onDeChange={(value) => { setBuscaDe(value); limparResultadosBusca('faixa') }}
          ate={buscaAte}
          onAteChange={(value) => { setBuscaAte(value); limparResultadosBusca('faixa') }}
          buscando={buscando || adicionandoItens}
          onBuscar={(pagina) => void buscarBens(pagina)}
          buscaRealizada={buscaAtiva.realizada}
          total={buscaAtiva.total}
          resultados={buscaAtiva.resultados}
          selecionados={buscaAtiva.selecionados}
          proximaPagina={buscaAtiva.proximaPagina}
          onAlternarBem={alternarBemBusca}
        />
      </section>
      </Form>
    </BemCadastroPageShell>
  )
}
