import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Boxes } from 'lucide-react'
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
  numero_processo: string
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
  numero_processo: 'Número do Processo',
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
      <input
        id={id}
        className={INPUT_CLASS}
        placeholder="Buscar Unidade Administrativa..."
        value={open ? search : displayValue}
        onFocus={() => { setOpen(true); setSearch('') }}
        onChange={e => setSearch(e.target.value)}
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto border border-gray-200 bg-white rounded shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Nenhuma unidade encontrada</div>
          ) : (
            filtered.map((ua: any) => (
              <button
                key={ua.unidade_administrativa_id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  String(ua.unidade_administrativa_id) === value
                    ? 'bg-green-50 text-green-700'
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
              </button>
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
    numero_processo: '',
    observacao: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Track original nome to detect changes for justificativa
  const [nomeOriginal] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [justificativaError, setJustificativaError] = useState('')

  const nomeAlterado = formBase.nome !== nomeOriginal
  const justificativaObrigatoria = nomeAlterado
  const justificativaHabilitada = nomeAlterado

  const [linhas, setLinhas] = useState<LinhaBemComId[]>([novaLinha()])
  const [linhasErrors, setLinhasErrors] = useState<
    Record<number, Record<string, string>>
  >({})

  const todasUAs = (user?.opcoes_escopo?.grupos ?? []).flatMap(
    (g: any) => g.uas ?? []
  )

  useEffect(() => {
    if (todasUAs.length === 1 && !formBase.unidade_administrativa) {
      setFormBase(prev => ({
        ...prev,
        unidade_administrativa: String(todasUAs[0].unidade_administrativa_id),
      }))
    }
  }, [todasUAs.length])

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

  const handleSave = async () => {
    const baseErrors = validarBase()
    if (Object.keys(baseErrors).length) {
      setFormErrors(baseErrors)
      toast.error('Preencha os campos obrigatórios.')
      return
    }

    if (justificativaObrigatoria && !justificativa.trim()) {
      setJustificativaError('Justificativa é obrigatória quando o Nome do Bem é alterado.')
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
        justificativa: justificativaHabilitada ? justificativa : '',
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
            variant="outline"
            onClick={() => navigate('/bens-patrimoniais')}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#00703C] hover:bg-[#005a30] text-white"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">

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
        </div>

        <div className="space-y-1">
          <label htmlFor="descricao" className="text-sm font-semibold text-gray-700">
            Descrição <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="descricao"
            className="min-h-25"
            placeholder="Descrição do Bem"
            value={formBase.descricao}
            onChange={e => setField('descricao', e.target.value)}
          />
          {formErrors.descricao && (
            <p className="text-xs text-red-500">{formErrors.descricao}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
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
        </div>

        <div className="space-y-1">
          <label htmlFor="numero_processo" className="text-sm font-semibold text-gray-700">
            Número do processo de incorporação
          </label>
          <Input
            id="numero_processo"
            className={INPUT_CLASS}
            placeholder="Número do processo de incorporação"
            value={formBase.numero_processo}
            onChange={e => setField('numero_processo', e.target.value)}
          />
        </div>

        {/* OBSERVAÇÃO */}
        <div className="space-y-1">
          <label htmlFor="observacao" className="text-sm font-semibold text-gray-700">
            Observação
          </label>
          <Textarea
            id="observacao"
            className="min-h-25"
            placeholder="Observação"
            value={formBase.observacao}
            onChange={e => setField('observacao', e.target.value)}
          />
        </div>

        {/* JUSTIFICATIVA */}
        <div className="space-y-1">
          <label htmlFor="justificativa" className="text-sm font-semibold text-gray-700">
            Justificativa
            {justificativaObrigatoria && <span className="text-red-500"> *</span>}
          </label>
          <Textarea
            id="justificativa"
            className="min-h-25 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={
              justificativaHabilitada
                ? 'Justificativa para a alteração'
                : 'Habilitado ao alterar Nome do Bem'
            }
            value={justificativa}
            disabled={!justificativaHabilitada}
            onChange={e => {
              setJustificativa(e.target.value)
              if (e.target.value.trim()) setJustificativaError('')
            }}
          />
          {justificativaError && (
            <p className="text-xs text-red-500">{justificativaError}</p>
          )}
        </div>

        {/* LINHAS DOS BENS */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#00703C]">
              Dados únicos por Bem
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Para adicionar mais bens, clique no botão + ao final da linha.
              Número Patrimonial, Formato Antigo, Sem Numeração e Localização
              são específicos de cada bem criado.
            </p>
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
              errors={linhasErrors[index]}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}