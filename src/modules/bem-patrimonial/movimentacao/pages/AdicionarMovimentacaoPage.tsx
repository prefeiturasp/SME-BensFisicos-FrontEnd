import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Network, Plus, Trash2 } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import { ConfirmDialog } from '@/components/ConfirmDialog'
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
  MovimentacaoBem,
  MovimentacaoFaixaNumeroPatrimonial,
  MovimentacaoUoCadastroOption,
} from '../types/movimentacao.types'
import type { UnidadeAdministrativa } from '@/modules/configuracoes/unidades-administrativas/types/unidades-administrativas.types'

type UaOption = { id: number; label: string }
type UoOption = { id: number; label: string; tem_ponto_central: boolean }
type FaixaMovimentacao = {
  id: string
  numeroDe: string
  numeroAte: string
  bens: MovimentacaoBem[]
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

function formatarFaixa(numeroDe: string, numeroAte: string) {
  return numeroDe === numeroAte ? numeroDe : `${numeroDe} até ${numeroAte}`
}

function resumirNomes(bens: MovimentacaoBem[]) {
  return bens.map((bem) => bem.nome).join(', ')
}

function formatarNP(value: string) {
  const digits = value.replaceAll(/\D/g, '').slice(0, 13)
  if (digits.length <= 3) return digits
  if (digits.length <= 12) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 12)}-${digits.slice(12)}`
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

type NumeroPatrimonialAutocompleteProps = Readonly<{
  id: string
  label: string
  value: string
  unidadeAdministrativaId: number | null
  onChange: (value: string) => void
}>

function NumeroPatrimonialAutocomplete({
  id,
  label,
  value,
  unidadeAdministrativaId,
  onChange,
}: NumeroPatrimonialAutocompleteProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [resultados, setResultados] = useState<MovimentacaoBem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const buscaRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setAberto(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setAberto(false)
    setResultados([])
  }, [unidadeAdministrativaId])

  const buscarBens = useCallback(
    async (termo: string) => {
      if (!unidadeAdministrativaId) return

      setCarregando(true)
      try {
        const resposta = await movimentacaoService.listBensMovimentaveis(
          unidadeAdministrativaId,
          termo,
        )
        setResultados(resposta.filter((bem) => Boolean(bem.numero_patrimonial)))
      } catch {
        setResultados([])
      } finally {
        setCarregando(false)
      }
    },
    [unidadeAdministrativaId],
  )

  const handleChange = (novoValor: string) => {
    const valorFormatado = formatarNP(novoValor)
    onChange(valorFormatado)
    setAberto(true)
    if (buscaRef.current) clearTimeout(buscaRef.current)
    buscaRef.current = setTimeout(() => void buscarBens(valorFormatado), 300)
  }

  return (
    <div className='relative flex flex-col gap-2' ref={containerRef}>
      <label htmlFor={id} className='text-sm font-semibold text-gray-700'>
        {label}
      </label>
      <div className='relative'>
        <Input
          id={id}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            setAberto(true)
            void buscarBens(value)
          }}
          placeholder='000.000000000-0'
          inputMode='numeric'
          maxLength={15}
          className={INPUT_CLASS}
          aria-autocomplete='list'
          aria-expanded={aberto}
        />
        {aberto && unidadeAdministrativaId && (
          <ul className='absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow-lg'>
            {carregando && <li className='px-3 py-2 text-sm text-gray-500'>Buscando...</li>}
            {!carregando && resultados.length === 0 && (
              <li className='px-3 py-2 text-sm text-gray-500'>Nenhum bem aprovado encontrado.</li>
            )}
            {!carregando &&
              resultados.length > 0 &&
              resultados.map((bem) => (
                <li key={bem.id} className='border-b border-gray-100 last:border-0'>
                  <button
                    type='button'
                    className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-[#00703C] hover:text-white'
                    onClick={() => {
                      onChange(bem.numero_patrimonial ?? '')
                      setAberto(false)
                    }}
                  >
                    {bem.numero_patrimonial} - {bem.nome}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function AdicionarMovimentacaoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const originUaId = user?.ua_ativa?.id ?? null
  const referenceUoId = user?.uo_ativa?.id ?? null
  const originUaLabel = user?.ua_ativa?.label ?? user?.ua_ativa?.codigo ?? '-'

  const form = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    mode: 'onSubmit',
    defaultValues: {
      unidade_orcamentaria_destino: '',
      unidade_administrativa_destino: '',
      observacao: '',
      itens: [],
      destino_mesma_uo: false,
      numero_de: '',
      numero_ate: '',
    },
  })

  const selectedUoId = form.watch('unidade_orcamentaria_destino')
  const selectedUaId = form.watch('unidade_administrativa_destino') ?? ''
  const numeroDe = form.watch('numero_de') ?? ''
  const numeroAte = form.watch('numero_ate') ?? ''
  const setSelectedUaId = useCallback(
    (value: string) => form.setValue('unidade_administrativa_destino', value),
    [form],
  )
  const setNumeroDe = useCallback(
    (value: string) => form.setValue('numero_de', value),
    [form],
  )
  const setNumeroAte = useCallback(
    (value: string) => form.setValue('numero_ate', value),
    [form],
  )
  const [faixas, setFaixas] = useState<FaixaMovimentacao[]>([])
  const [selecionarTodos, setSelecionarTodos] = useState(false)
  const [confirmarSelecionarTodos, setConfirmarSelecionarTodos] = useState(false)
  const [bensSelecionarTodos, setBensSelecionarTodos] = useState<MovimentacaoBem[]>([])
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

  const itensSelecionados = useMemo(() => {
    if (selecionarTodos) return bensSelecionarTodos
    return faixas.flatMap((faixa) => faixa.bens)
  }, [bensSelecionarTodos, faixas, selecionarTodos])
  useEffect(() => {
    form.setValue('itens', itensSelecionados.map((bem) => bem.id), {
      shouldValidate: form.formState.isSubmitted,
    })
  }, [itensSelecionados, form])

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
  const canSave = !adicionandoItens && !submitting

  useEffect(() => {
    if (!destinoMesmaUo || !selectedUoId) {
      if (selectedUaId) setSelectedUaId('')
      return
    }
    if (selectedUaId && !uaOptions.some((ua) => String(ua.id) === selectedUaId)) {
      setSelectedUaId('')
    }
  }, [destinoMesmaUo, selectedUaId, selectedUoId, uaOptions])

  /**
   * Erros da sub-ação de itens (adicionar faixa / selecionar todos) são
   * exibidos inline no campo correspondente, além do toast.
   */
  const exibirErro = useCallback(
    (message: string, campo: 'numero_de' | 'itens' = 'itens') => {
      form.setError(campo, { message })
      toast.error(message)
    },
    [form],
  )

  const limparErros = useCallback(() => {
    form.clearErrors(['itens', 'numero_de'])
    form.clearErrors('root.serverError')
  }, [form])

  const addFaixa = useCallback(async () => {
    if (!originUaId || !numeroDe.trim()) {
      exibirErro('Informe o Número Patrimonial - De.', 'numero_de')
      return
    }

    const numeroDeNormalizado = numeroDe.trim()
    const numeroAteNormalizado = numeroAte.trim() || numeroDeNormalizado
    if (numeroAteNormalizado < numeroDeNormalizado) {
      exibirErro(
        'O Número Patrimonial Até deve ser maior ou igual ao Número Patrimonial De.',
        'numero_de',
      )
      return
    }
    if (
      faixas.some(
        (faixa) =>
          numeroDeNormalizado <= faixa.numeroAte && numeroAteNormalizado >= faixa.numeroDe,
      )
    ) {
      exibirErro('Os bens informados já foram adicionados à movimentação.')
      return
    }

    const faixa: MovimentacaoFaixaNumeroPatrimonial = {
      numero_patrimonial_de: numeroDeNormalizado,
      ...(numeroAteNormalizado === numeroDeNormalizado
        ? {}
        : { numero_patrimonial_ate: numeroAteNormalizado }),
    }
    setAdicionandoItens(true)
    limparErros()
    try {
      const { itens } = await movimentacaoService.resolverItensLote({
        unidade_administrativa_origem: originUaId,
        faixas: [faixa],
      })
      const idsExistentes = new Set(faixas.flatMap((item) => item.bens.map((bem) => bem.id)))
      if (itens.some((bem) => idsExistentes.has(bem.id))) {
        exibirErro('Os bens informados já foram adicionados à movimentação.')
        return
      }
      setFaixas((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          numeroDe: faixa.numero_patrimonial_de,
          numeroAte: numeroAteNormalizado,
          bens: itens,
        },
      ])
      setNumeroDe('')
      setNumeroAte('')
    } catch (requestError: unknown) {
      exibirErro(
        requestError instanceof Error
          ? requestError.message
          : 'Erro ao adicionar itens de movimentação.',
      )
    } finally {
      setAdicionandoItens(false)
    }
  }, [exibirErro, limparErros, faixas, numeroAte, numeroDe, originUaId, setNumeroDe, setNumeroAte])

  const handleSelecionarTodos = useCallback(
    async (checked: boolean) => {
      if (!checked) {
        setSelecionarTodos(false)
        setBensSelecionarTodos([])
        return
      }
      if (!originUaId) {
        exibirErro('Informe a Unidade Administrativa de origem.')
        return
      }

      setAdicionandoItens(true)
      limparErros()
      try {
        const { itens } = await movimentacaoService.resolverItensLote({
          unidade_administrativa_origem: originUaId,
          selecionar_todos: true,
        })
        if (itens.length === 0) {
          exibirErro('Nenhum bem aprovado foi encontrado na unidade administrativa de origem.')
          return
        }
        setFaixas([])
        setBensSelecionarTodos(itens)
        setSelecionarTodos(true)
      } catch (requestError: unknown) {
        exibirErro(
          requestError instanceof Error
            ? requestError.message
            : 'Erro ao adicionar itens de movimentação.',
        )
      } finally {
        setAdicionandoItens(false)
      }
    },
    [exibirErro, limparErros, originUaId],
  )

  const removerFaixa = (faixaId: string) => {
    setFaixas((current) => current.filter((item) => item.id !== faixaId))
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

    setSubmitting(true)
    try {
      await movimentacaoService.create({
        unidade_administrativa_origem: originUaId,
        unidade_orcamentaria_destino: selectedUoNumericId,
        observacao: values.observacao ?? '',
        ...(selecionarTodos
          ? { selecionar_todos: true }
          : {
              faixas: faixas.map(({ numeroDe: de, numeroAte: ate }) => ({
                numero_patrimonial_de: de,
                ...(de === ate ? {} : { numero_patrimonial_ate: ate }),
              })),
            }),
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
        <Input
          id='ua-origem'
          value={originUaLabel}
          disabled
          className={`${INPUT_CLASS} bg-gray-50 text-gray-500 cursor-not-allowed`}
        />
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
              limparErros()
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
              limparErros()
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
                  limparErros()
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
        <div className='flex items-center gap-2'>
          <Checkbox
            id='selecionar-todos-bens'
            checked={selecionarTodos}
            disabled={!originUaId || adicionandoItens}
            onCheckedChange={(checked) => {
              if (checked === true && faixas.length > 0) {
                setConfirmarSelecionarTodos(true)
                return
              }
              void handleSelecionarTodos(checked === true)
            }}
          />
          <label htmlFor='selecionar-todos-bens' className='text-sm font-medium text-gray-700'>
            Selecionar todos os Bens aprovados da UA de origem
          </label>
        </div>
        {selecionarTodos ? (
          <div className='overflow-x-auto rounded border border-gray-200'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 text-left text-gray-700'>
                <tr>
                  <th className='p-3'>Número Patrimonial</th>
                  <th className='p-3'>Bens selecionados</th>
                  <th className='p-3 text-center'>Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr className='border-t border-gray-200'>
                  <td className='p-3'>Todos os Bens aprovados da UA de origem</td>
                  <td className='p-3'>{bensSelecionarTodos.length} bem(ns) selecionado(s)</td>
                  <td className='p-3 text-center'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Excluir seleção de todos os Bens'
                      onClick={() => void handleSelecionarTodos(false)}
                    >
                      <Trash2 className='size-5 text-[#00703C]' />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end'>
            <FormField
              control={form.control}
              name='numero_de'
              render={() => (
                <FormItem>
                  <NumeroPatrimonialAutocomplete
                    id='numero-patrimonial-de'
                    label='Número Patrimonial - De'
                    value={numeroDe}
                    unidadeAdministrativaId={originUaId}
                    onChange={setNumeroDe}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <NumeroPatrimonialAutocomplete
              id='numero-patrimonial-ate'
              label='Número Patrimonial - Até'
              value={numeroAte}
              unidadeAdministrativaId={originUaId}
              onChange={setNumeroAte}
            />
            <Button
              type='button'
              variant='outline'
              className='h-11 border-[#00703C] text-[#00703C] hover:bg-[#00703C] hover:text-white'
              onClick={() => void addFaixa()}
              disabled={adicionandoItens}
            >
              <Plus className='size-5' aria-hidden='true' />
              {adicionandoItens ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        )}
        {faixas.length > 0 ? (
          <div className='overflow-x-auto rounded border border-gray-200'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 text-left text-gray-700'>
                <tr>
                  <th className='p-3'>Número Patrimonial</th>
                  <th className='p-3'>Nome do Bem</th>
                  <th className='p-3 text-center'>Ação</th>
                </tr>
              </thead>
              <tbody>
                {faixas.map((faixa) => (
                  <tr key={faixa.id} className='border-t border-gray-200'>
                    <td className='p-3'>{formatarFaixa(faixa.numeroDe, faixa.numeroAte)}</td>
                    <td className='p-3'>{resumirNomes(faixa.bens)}</td>
                    <td className='p-3 text-center'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        aria-label={`Excluir faixa ${formatarFaixa(faixa.numeroDe, faixa.numeroAte)}`}
                        onClick={() => removerFaixa(faixa.id)}
                      >
                        <Trash2 className='size-5 text-[#00703C]' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      <ConfirmDialog
        open={confirmarSelecionarTodos}
        title='Selecionar todos os Bens'
        message='As faixas já adicionadas serão removidas. Deseja continuar?'
        confirmLabel='Continuar'
        onClose={() => setConfirmarSelecionarTodos(false)}
        onConfirm={() => {
          setConfirmarSelecionarTodos(false)
          void handleSelecionarTodos(true)
        }}
      />
      </Form>
    </BemCadastroPageShell>
  )
}