import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ValidatedField } from '@/components/form-fields/ValidatedField'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Boxes, Info, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { bemService } from '../services/bem.service'
import { BEM_LIMITS, erroLimiteMaximo } from '../utils/bem-limits'
import {
  DICA_VALOR_UNITARIO,
  VALOR_UNITARIO_TAMANHO_MAX,
  formatarValorInput,
  maskValorUnitario,
  validarValorUnitario,
} from '../utils/valor-monetario'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LinhaBemRow, isLinhaBemVazia, type LinhaBem } from '../components/LinhaBemRow'
import { useAuth } from '@/auth/useAuth'
import { useUnsavedChanges } from '@/components/unsaved-changes/useUnsavedChanges'

type LinhaBemComId = LinhaBem & { id: string }

type FormBase = {
  unidade_administrativa: string
  nome: string
  descricao: string
  valor_unitario: string
  marca: string
  modelo: string
  observacao: string
}

type FormErrors = Partial<Record<keyof FormBase, string>>

const INPUT_CLASS =
  'h-11 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700'

const CAMPOS_OBRIGATORIOS: (keyof FormBase)[] = [
  'unidade_administrativa',
  'nome',
  'descricao',
  'valor_unitario',
  'marca',
  'modelo',
]

const LABEL_CAMPO: Record<keyof FormBase, string> = {
  unidade_administrativa: 'Unidade Administrativa',
  nome: 'Nome do Bem',
  descricao: 'Descrição',
  valor_unitario: 'Valor Unitário',
  marca: 'Marca',
  modelo: 'Modelo',
  observacao: 'Observação',
}

function UASearchSelect({
  value,
  onChange,
  uas,
  invalid = false,
  id,
}: Readonly<{
  value: string
  onChange: (id: string) => void
  uas: any[]
  /** Pinta a borda do input. A mensagem fica a cargo do ValidatedField. */
  invalid?: boolean
  id?: string
}>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [displayValue, setDisplayValue] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value) { setDisplayValue(''); return }
    const ua = uas.find((u: any) => String(u.unidade_administrativa_id) === String(value))
    if (ua) setDisplayValue(ua.label)
  }, [value, uas])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = search
    ? uas.filter((u: any) => u.label.toLowerCase().includes(search.toLowerCase()))
    : uas

  return (
    <div ref={ref} className="relative">
      <Input
        id={id}
        className={INPUT_CLASS}
        placeholder="Buscar Unidade Administrativa..."
        aria-invalid={invalid}
        value={open ? search : displayValue}
        onFocus={() => { setOpen(true); setSearch('') }}
        onChange={e => setSearch(e.target.value)}
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto border border-gray-200 bg-white rounded shadow-lg p-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Nenhuma unidade encontrada</div>
          ) : (
            filtered.map((ua: any) => (
              <Button
                key={ua.unidade_administrativa_id}
                type="button"
                variant="ghost"
                className={`w-full justify-start text-left px-3 py-2 h-auto font-normal ${
                  String(ua.unidade_administrativa_id) === value
                    ? 'bg-green-50 text-green-700 hover:bg-green-50'
                    : 'text-gray-700'
                }`}
                onClick={() => {
                  onChange(String(ua.unidade_administrativa_id))
                  setDisplayValue(ua.label)
                  setSearch('')
                  setOpen(false)
                }}
              >
                {ua.label}
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function novaLinha(): LinhaBemComId {
  return {
    id: crypto.randomUUID(),
    numero_patrimonial: '',
    numero_formato_antigo: false,
    sem_numeracao: false,
    localizacao: '',
    numero_processo: '',
  }
}

export default function BemCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formBase, setFormBase] = useState<FormBase>({
    unidade_administrativa: '',
    nome: '',
    descricao: '',
    valor_unitario: '',
    marca: '',
    modelo: '',
    observacao: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const [linhas, setLinhas] = useState<LinhaBemComId[]>([novaLinha()])
  const [linhasErrors, setLinhasErrors] = useState<
    Record<number, Record<string, string>>
  >({})
  const [linhaPendente, setLinhaPendente] = useState<{
    linha: LinhaBemComId
    index: number
  } | null>(null)

  const todasUAs = (user?.opcoes_escopo?.grupos ?? []).flatMap(
    (g: any) => g.uas ?? []
  )

  const uaAtivaId = user?.ua_ativa?.id ?? null
  const exigeSelecaoManualDeUA = !uaAtivaId

  const hasUnsavedChanges =
    Object.entries(formBase).some(([field, value]) => {
      if (field === 'unidade_administrativa') {
        return exigeSelecaoManualDeUA && todasUAs.length !== 1 && Boolean(value)
      }
      return Boolean(value.trim())
    }) || linhas.some((linha) => !isLinhaBemVazia(linha))
  const { navigateAfterSave } = useUnsavedChanges(hasUnsavedChanges, 'create')

  useEffect(() => {
    if (uaAtivaId && formBase.unidade_administrativa !== String(uaAtivaId)) {
      setFormBase(prev => ({
        ...prev,
        unidade_administrativa: String(uaAtivaId),
      }))
      return
    }

    if (!uaAtivaId && todasUAs.length === 1 && !formBase.unidade_administrativa) {
      setFormBase(prev => ({
        ...prev,
        unidade_administrativa: String(todasUAs[0].unidade_administrativa_id),
      }))
    }
  }, [uaAtivaId, todasUAs.length])

  /**
   * Adicionar/remover linhas reordena os índices, então os erros das linhas
   * são zerados nessas duas ações. A digitação limpa apenas o campo alterado
   * (`limparErroLinha`), mesmo padrão das telas em react-hook-form.
   */
  const resetLinhas = (
    updater: React.SetStateAction<LinhaBemComId[]>
  ) => {
    setLinhas(updater)
    setLinhasErrors({})
  }

  const addLinha = () => resetLinhas(prev => [...prev, novaLinha()])

  const executarRemocaoPorId = (id: string) => {
    resetLinhas(prev => prev.filter(linha => linha.id !== id))
  }

  const solicitarRemocao = (index: number) => {
    if (linhas.length === 1) return
    const alvo = linhas[index]
    if (!alvo) return
    if (isLinhaBemVazia(alvo)) {
      executarRemocaoPorId(alvo.id)
      return
    }
    setLinhaPendente({ linha: alvo, index })
  }

  const confirmarRemocaoPendente = () => {
    if (!linhaPendente) return
    executarRemocaoPorId(linhaPendente.linha.id)
    setLinhaPendente(null)
  }

  const cancelarRemocaoPendente = () => {
    setLinhaPendente(null)
  }

  const limparErroLinha = (index: number, campo: string) => {
    setLinhasErrors(prev => {
      if (!prev[index]?.[campo]) return prev
      const next = { ...prev }
      const errosLinha = { ...next[index] }
      delete errosLinha[campo]
      if (Object.keys(errosLinha).length === 0) {
        delete next[index]
      } else {
        next[index] = errosLinha
      }
      return next
    })
  }

  const validarBase = (): FormErrors => {
    const errors: FormErrors = {}
    CAMPOS_OBRIGATORIOS.forEach(campo => {
      if (!formBase[campo]?.trim()) {
        errors[campo] = `${LABEL_CAMPO[campo]} é obrigatório.`
      }
    })

    const limitesBase: Array<{ campo: keyof FormBase; limite: number }> = [
      { campo: 'nome', limite: BEM_LIMITS.nome },
      { campo: 'descricao', limite: BEM_LIMITS.descricao },
      { campo: 'marca', limite: BEM_LIMITS.marca },
      { campo: 'modelo', limite: BEM_LIMITS.modelo },
      { campo: 'observacao', limite: BEM_LIMITS.observacao },
    ]
    for (const { campo, limite } of limitesBase) {
      const erro = erroLimiteMaximo(formBase[campo], limite)
      if (erro) errors[campo] = erro
    }

    if (!errors.valor_unitario) {
      const erroValor = validarValorUnitario(formBase.valor_unitario)
      if (erroValor) errors.valor_unitario = erroValor
    }

    return errors
  }

  const validarLinhas = (): Record<number, Record<string, string>> => {
    const errors: Record<number, Record<string, string>> = {}
    linhas.forEach((linha, index) => {
      const errosLinha: Record<string, string> = {}
      if (!linha.localizacao?.trim()) {
        errosLinha.localizacao = 'Localização é obrigatória.'
      } else {
        const erro = erroLimiteMaximo(
          linha.localizacao,
          BEM_LIMITS.localizacao
        )
        if (erro) errosLinha.localizacao = erro
      }
      if (!linha.sem_numeracao && !linha.numero_patrimonial?.trim()) {
        errosLinha.numero_patrimonial = 'Número patrimonial é obrigatório.'
      } else {
        const erroPatrimonial = erroLimiteMaximo(
          linha.numero_patrimonial,
          BEM_LIMITS.numero_patrimonial
        )
        if (erroPatrimonial) errosLinha.numero_patrimonial = erroPatrimonial
      }
      const erroProcesso = erroLimiteMaximo(
        linha.numero_processo,
        BEM_LIMITS.numero_processo
      )
      if (erroProcesso) errosLinha.numero_processo = erroProcesso
      if (Object.keys(errosLinha).length) {
        errors[index] = errosLinha
      }
    })
    return errors
  }

  const handleSave = async () => {
    // Todas as pendências são calculadas juntas para que o formulário e as
    // linhas exibam simultaneamente os campos que precisam de correção.
    const baseErrors = validarBase()
    const linhaErrors = validarLinhas()

    setFormErrors(baseErrors)
    setLinhasErrors(linhaErrors)

    if (Object.keys(baseErrors).length || Object.keys(linhaErrors).length) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }

    setLoading(true)
    try {
      await bemService.createMulti({
        ...formBase,
        multi_payload: linhas.map(({ id: _id, ...rest }) => rest),
      })
      toast.success('Bens criados com sucesso')
      navigateAfterSave(() => navigate('/bens-patrimoniais'))
    } catch (error: any) {
      const data = error?.response?.data
      if (data?.linhas) {
        const erros: Record<number, Record<string, string>> = {}
        Object.entries(data.linhas).forEach(([idx, errs]) => {
          erros[Number(idx)] = errs as Record<string, string>
        })
        setLinhasErrors(erros)
        toast.error('Corrija os erros nas linhas dos bens.')
      } else if (data && typeof data === 'object') {
        setFormErrors(data as FormErrors)
        toast.error('Corrija os erros no formulário.')
      } else {
        toast.error('Erro ao salvar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const setField = (campo: keyof FormBase, valor: string) => {
    const valorFinal =
      campo === 'valor_unitario' ? maskValorUnitario(valor) : valor
    setFormBase(prev => ({ ...prev, [campo]: valorFinal }))
    if (formErrors[campo]) {
      setFormErrors(prev => {
        const next = { ...prev }
        delete next[campo]
        return next
      })
    }
  }

  return (
    <div className="p-8 space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Boxes },
          { label: 'Bens Patrimoniais', to: '/bens-patrimoniais' },
          { label: 'Adicionar Bem Patrimonial', isActive: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#363636]">
          Adicionar Bem Patrimonial
        </h1>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/bens-patrimoniais')}
            className="h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-10 px-6 bg-[#2F7D57] text-white font-semibold rounded-md transition-colors hover:bg-[#256947] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">

        {exigeSelecaoManualDeUA && (
          <div className="grid grid-cols-2 gap-6">
            <ValidatedField
              label="Unidade Administrativa"
              htmlFor="unidade_administrativa"
              error={formErrors.unidade_administrativa}
              required
            >
              <UASearchSelect
                id="unidade_administrativa"
                value={formBase.unidade_administrativa}
                onChange={id => setField('unidade_administrativa', id)}
                uas={todasUAs}
                invalid={!!formErrors.unidade_administrativa}
              />
            </ValidatedField>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <ValidatedField
            label="Nome do Bem"
            htmlFor="nome"
            error={formErrors.nome} required
          >
            <Input
              id="nome"
              className={INPUT_CLASS}
              placeholder="Nome do Bem"
              aria-invalid={!!formErrors.nome}
              value={formBase.nome}
              maxLength={BEM_LIMITS.nome}
              onChange={e => setField('nome', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              {formBase.nome.length}/{BEM_LIMITS.nome}
            </p>
          </ValidatedField>

          <ValidatedField
            label="Marca"
            htmlFor="marca"
            error={formErrors.marca} required
          >
            <Input
              id="marca"
              className={INPUT_CLASS}
              placeholder="Marca"
              aria-invalid={!!formErrors.marca}
              value={formBase.marca}
              maxLength={BEM_LIMITS.marca}
              onChange={e => setField('marca', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              {formBase.marca.length}/{BEM_LIMITS.marca}
            </p>
          </ValidatedField>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ValidatedField
            label="Modelo"
            htmlFor="modelo"
            error={formErrors.modelo} required
          >
            <Input
              id="modelo"
              className={INPUT_CLASS}
              placeholder="Modelo"
              aria-invalid={!!formErrors.modelo}
              value={formBase.modelo}
              maxLength={BEM_LIMITS.modelo}
              onChange={e => setField('modelo', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              {formBase.modelo.length}/{BEM_LIMITS.modelo}
            </p>
          </ValidatedField>

          <ValidatedField
            label="Valor Unitário"
            htmlFor="valor_unitario"
            error={formErrors.valor_unitario} required
          >
            <Input
              id="valor_unitario"
              className={INPUT_CLASS}
              placeholder="0,00"
              aria-invalid={!!formErrors.valor_unitario}
              value={formBase.valor_unitario}
              maxLength={VALOR_UNITARIO_TAMANHO_MAX}
              inputMode="decimal"
              onChange={e => setField('valor_unitario', e.target.value)}
              onBlur={e => {
                const formatado = formatarValorInput(e.target.value)
                if (formatado && formatado !== e.target.value) {
                  setField('valor_unitario', formatado)
                }
              }}
            />
            <p className="text-xs text-gray-500">{DICA_VALOR_UNITARIO}</p>
          </ValidatedField>
        </div>

        <ValidatedField
          label="Descrição do Bem"
          htmlFor="descricao"
          error={formErrors.descricao}
          required
        >
          <Textarea
            id="descricao"
            className="min-h-25"
            placeholder="Descreva o bem"
            aria-invalid={!!formErrors.descricao}
            value={formBase.descricao}
            maxLength={BEM_LIMITS.descricao}
            onChange={e => setField('descricao', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            {formBase.descricao.length}/{BEM_LIMITS.descricao}
          </p>
        </ValidatedField>

        {/* OBSERVAÇÕES */}
        <ValidatedField label="Observações" htmlFor="observacao" error={formErrors.observacao}>
          <Textarea
            id="observacao"
            className="min-h-25"
            placeholder="Observações"
            value={formBase.observacao}
            maxLength={BEM_LIMITS.observacao}
            onChange={e => setField('observacao', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            {formBase.observacao.length}/{BEM_LIMITS.observacao}
          </p>
        </ValidatedField>

        {/* LINHAS DOS BENS */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-[#00703C]">
              Adicionar Bens Patrimoniais
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6} className="max-w-80">
                Para adicionar mais bens, clique em Adicionar bem abaixo. Para
                remover uma linha, use o botão de lixeira da linha. Linhas
                preenchidas pedem confirmação antes de excluir.
              </TooltipContent>
            </Tooltip>
          </div>

          {linhas.map((linha, index) => (
            <LinhaBemRow
              key={linha.id}
              linha={linha}
              index={index}
              linhas={linhas}
              setLinhas={setLinhas as any}
              removeLinha={solicitarRemocao}
              podeRemover={linhas.length > 1}
              errors={linhasErrors[index]}
              onLimparErro={limparErroLinha}
            />
          ))}

          <div className="flex justify-start pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={addLinha}
              aria-label="Adicionar bem"
              className="h-10 border-[#2F7D57] bg-white px-4 font-semibold text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white"
            >
              <Plus size={18} />
              Adicionar bem
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={linhaPendente !== null}
        title="Excluir linha"
        message="Deseja excluir esta linha? Os dados preenchidos serão perdidos. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Manter"
        variant="destructive"
        testId="excluir-linha-dialog"
        onConfirm={confirmarRemocaoPendente}
        onClose={cancelarRemocaoPendente}
      />
    </div>
  )
}
