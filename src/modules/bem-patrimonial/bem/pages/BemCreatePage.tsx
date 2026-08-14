import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Boxes, Info } from 'lucide-react'
import { toast } from 'sonner'
import { bemService } from '../services/bem.service'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { LinhaBemRow, type LinhaBem } from '../components/LinhaBemRow'
import { useAuth } from '@/auth/useAuth'

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
  error,
  id,
}: Readonly<{
  value: string
  onChange: (id: string) => void
  uas: any[]
  error?: string
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
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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

  const todasUAs = (user?.opcoes_escopo?.grupos ?? []).flatMap(
    (g: any) => g.uas ?? []
  )

  const uaAtivaId = user?.ua_ativa?.id ?? null
  const exigeSelecaoManualDeUA = !uaAtivaId

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

  const updateLinhas = (
    updater: React.SetStateAction<LinhaBemComId[]>
  ) => {
    setLinhas(updater)
    setLinhasErrors({})
  }

  const addLinha = () => updateLinhas(prev => [...prev, novaLinha()])

  const removeLinha = (index: number) => {
    if (linhas.length === 1) return
    updateLinhas(prev => prev.filter((_, i) => i !== index))
  }

  const validarBase = (): FormErrors => {
    const errors: FormErrors = {}
    CAMPOS_OBRIGATORIOS.forEach(campo => {
      if (!formBase[campo]?.trim()) {
        errors[campo] = `${LABEL_CAMPO[campo]} é obrigatório.`
      }
    })
    return errors
  }

  const validarLinhas = (): Record<number, Record<string, string>> => {
    const errors: Record<number, Record<string, string>> = {}
    linhas.forEach((linha, index) => {
      const errosLinha: Record<string, string> = {}
      if (!linha.localizacao?.trim()) {
        errosLinha.localizacao = 'Localização é obrigatória.'
      }
      if (Object.keys(errosLinha).length) {
        errors[index] = errosLinha
      }
    })
    return errors
  }

  // Habilita o botão Salvar apenas quando todos os campos obrigatórios do
  // formulário e de todas as linhas de bens já foram preenchidos.
  const formValido =
    CAMPOS_OBRIGATORIOS.every(campo => !!formBase[campo]?.trim()) &&
    linhas.every(linha => !!linha.localizacao?.trim())

  const handleSave = async () => {
    const baseErrors = validarBase()
    if (Object.keys(baseErrors).length) {
      setFormErrors(baseErrors)
      toast.error('Preencha os campos obrigatórios.')
      return
    }

    const linhaErrors = validarLinhas()
    if (Object.keys(linhaErrors).length) {
      setLinhasErrors(linhaErrors)
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
      navigate('/bens-patrimoniais')
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
    setFormBase(prev => ({ ...prev, [campo]: valor }))
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
            onClick={handleSave}
            disabled={loading || !formValido}
            className="h-10 px-6 bg-[#00703C] hover:bg-[#005a30] text-white font-semibold !rounded-sm transition-colors disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-[#00703C]/25 disabled:text-white disabled:hover:bg-[#00703C]/25"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/bens-patrimoniais')}
            className="h-10 px-6 bg-white border border-[#00703C] text-[#00703C] hover:bg-[#00703C] hover:text-white font-semibold !rounded-sm transition-colors"
          >
            Cancelar
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">

        {exigeSelecaoManualDeUA && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="unidade_administrativa" className="text-sm font-semibold text-gray-700">
                Unidade Administrativa <span className="text-red-500">*</span>
              </label>
              <UASearchSelect
                id="unidade_administrativa"
                value={formBase.unidade_administrativa}
                onChange={id => setField('unidade_administrativa', id)}
                uas={todasUAs}
                error={formErrors.unidade_administrativa}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="nome" className="text-sm font-semibold text-gray-700">
              Nome do Bem <span className="text-red-500">*</span>
            </label>
            <Input
              id="nome"
              className={INPUT_CLASS}
              placeholder="Nome do Bem"
              value={formBase.nome}
              onChange={e => setField('nome', e.target.value)}
            />
            {formErrors.nome && (
              <p className="text-xs text-red-500">{formErrors.nome}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="marca" className="text-sm font-semibold text-gray-700">
              Marca <span className="text-red-500">*</span>
            </label>
            <Input
              id="marca"
              className={INPUT_CLASS}
              placeholder="Marca"
              value={formBase.marca}
              onChange={e => setField('marca', e.target.value)}
            />
            {formErrors.marca && (
              <p className="text-xs text-red-500">{formErrors.marca}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="modelo" className="text-sm font-semibold text-gray-700">
              Modelo <span className="text-red-500">*</span>
            </label>
            <Input
              id="modelo"
              className={INPUT_CLASS}
              placeholder="Modelo"
              value={formBase.modelo}
              onChange={e => setField('modelo', e.target.value)}
            />
            {formErrors.modelo && (
              <p className="text-xs text-red-500">{formErrors.modelo}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="valor_unitario" className="text-sm font-semibold text-gray-700">
              Valor Unitário <span className="text-red-500">*</span>
            </label>
            <Input
              id="valor_unitario"
              className={INPUT_CLASS}
              placeholder="0,00"
              value={formBase.valor_unitario}
              onChange={e => setField('valor_unitario', e.target.value)}
            />
            {formErrors.valor_unitario && (
              <p className="text-xs text-red-500">{formErrors.valor_unitario}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="descricao" className="text-sm font-semibold text-gray-700">
            Descrição do Bem <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="descricao"
            className="min-h-25"
            placeholder="Descreva o bem"
            value={formBase.descricao}
            onChange={e => setField('descricao', e.target.value)}
          />
          {formErrors.descricao && (
            <p className="text-xs text-red-500">{formErrors.descricao}</p>
          )}
        </div>

        {/* OBSERVAÇÕES */}
        <div className="space-y-1">
          <label htmlFor="observacao" className="text-sm font-semibold text-gray-700">
            Observações
          </label>
          <Textarea
            id="observacao"
            className="min-h-25"
            placeholder="Observações"
            value={formBase.observacao}
            onChange={e => setField('observacao', e.target.value)}
          />
        </div>

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
                Para adicionar mais bens, clique no botão + ao final da linha.
                Caso não seja necessário o novo item do bem, ele pode ser
                removido no botão de lixeira.
              </TooltipContent>
            </Tooltip>
          </div>

          {linhas.map((linha, index) => (
            <LinhaBemRow
              key={linha.id}
              linha={linha}
              index={index}
              linhas={linhas}
              setLinhas={updateLinhas as any}
              removeLinha={removeLinha}
              addLinha={addLinha}
              isLast={index === linhas.length - 1}
              podeRemover={linhas.length > 1}
              errors={linhasErrors[index]}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}