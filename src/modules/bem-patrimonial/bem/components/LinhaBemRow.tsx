import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Info } from 'lucide-react'
import { useNumeroPatrimonial } from '../hooks/useNumeroPatrimonial'
import { valorSelectFormato } from '../utils/formato-bem'

export type LinhaBem = {
  numero_patrimonial: string
  numero_formato_antigo: boolean
  sem_numeracao: boolean
  localizacao: string
  numero_processo: string
}

export type LinhaBemRowProps = Readonly<{
  linha: LinhaBem
  index: number
  linhas: LinhaBem[]
  setLinhas: React.Dispatch<React.SetStateAction<LinhaBem[]>>
  removeLinha: (index: number) => void
  addLinha: () => void
  isLast: boolean
  podeRemover?: boolean
  errors?: Record<string, string>
}>

const INPUT_CLASS =
  '!h-11 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700'

export function LinhaBemRow({
  linha,
  index,
  linhas,
  setLinhas,
  removeLinha,
  addLinha,
  isLast,
  podeRemover = true,
  errors,
}: LinhaBemRowProps) {

  const numeroHook = useNumeroPatrimonial({
    valor: linha.numero_patrimonial,
    formatoAntigoInicial: linha.numero_formato_antigo,
    semNumeracaoInicial: linha.sem_numeracao,
  })

  const valorFormato = valorSelectFormato(
    linha.numero_formato_antigo,
    linha.sem_numeracao
  )

  const handleFormatoChange = (valor: string) => {
    const newLinhas = [...linhas]

    if (valor === 'formato_anterior') {
      newLinhas[index].numero_formato_antigo = true
      newLinhas[index].sem_numeracao = false
      numeroHook.ativarFormatoAntigo()
    } else if (valor === 'sem_numeracao') {
      newLinhas[index].numero_formato_antigo = false
      newLinhas[index].sem_numeracao = true
      newLinhas[index].numero_patrimonial = ''
    } else {
      newLinhas[index].numero_formato_antigo = false
      newLinhas[index].sem_numeracao = false
      numeroHook.desativarFormatoAntigo()
    }

    setLinhas(newLinhas)
  }

  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_auto] gap-6 items-start border rounded p-4">

      {/* NÚMERO PATRIMONIAL */}
      <div className="space-y-1">
        <label htmlFor={`numero_patrimonial_${index}`} className="text-sm font-semibold text-gray-700">
          Número Patrimonial <span className="text-red-500">*</span>
        </label>
        <Input
          id={`numero_patrimonial_${index}`}
          className={INPUT_CLASS}
          placeholder="000.000000000-0"
          value={linha.numero_patrimonial}
          disabled={numeroHook.disabled}
          onChange={(e) => {
            const masked = numeroHook.applyMask(e.target.value)
            const newLinhas = [...linhas]
            newLinhas[index].numero_patrimonial = masked
            setLinhas(newLinhas)
          }}
        />
        {errors?.numero_patrimonial && (
          <p className="text-xs text-red-500">{errors.numero_patrimonial}</p>
        )}
      </div>

      {/* FORMATO */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <label htmlFor={`formato_${index}`} className="text-sm font-semibold text-gray-700">
            Formato
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={14} className="text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-70">
              Se marcado “Formato anterior”, não valida o formato do número (valor
              livre). Já se marcado “Sem número patrimonial”, o sistema atribui NP
              automaticamente.
            </TooltipContent>
          </Tooltip>
        </div>

        <Select value={valorFormato} onValueChange={handleFormatoChange}>
          <SelectTrigger id={`formato_${index}`} className={INPUT_CLASS}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formato_anterior">Formato anterior</SelectItem>
            <SelectItem value="sem_numeracao">Sem número patrimonial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LOCALIZAÇÃO */}
      <div className="space-y-1">
        <label htmlFor={`localizacao_${index}`} className="text-sm font-semibold text-gray-700">
          Localização <span className="text-red-500">*</span>
        </label>
        <Input
          id={`localizacao_${index}`}
          className={INPUT_CLASS}
          placeholder="Insira a localização do bem"
          value={linha.localizacao}
          onChange={(e) => {
            const newLinhas = [...linhas]
            newLinhas[index].localizacao = e.target.value
            setLinhas(newLinhas)
          }}
        />
        {errors?.localizacao && (
          <p className="text-xs text-red-500">{errors.localizacao}</p>
        )}
      </div>

      {/* NÚMERO DO PROCESSO DE INCORPORAÇÃO */}
      <div className="space-y-1">
        <label htmlFor={`numero_processo_${index}`} className="text-sm font-semibold text-gray-700">
          Número do Processo de Incorporação
        </label>
        <Input
          id={`numero_processo_${index}`}
          className={INPUT_CLASS}
          placeholder="Insira o nº do processo de incorporação"
          value={linha.numero_processo}
          onChange={(e) => {
            const newLinhas = [...linhas]
            newLinhas[index].numero_processo = e.target.value
            setLinhas(newLinhas)
          }}
        />
        {errors?.numero_processo && (
          <p className="text-xs text-red-500">{errors.numero_processo}</p>
        )}
      </div>

      {/* AÇÕES */}
      <div className="flex gap-2 pt-6">
        {podeRemover && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => removeLinha(index)}
            aria-label="Remover bem"
          >
            <Trash2 size={18} />
          </Button>
        )}

        {isLast && (
          <Button
            type="button"
            variant="outline"
            onClick={addLinha}
            aria-label="Adicionar bem"
            className="border-[#00703C] text-[#00703C] hover:bg-[#00703C] hover:text-white h-10 w-10 p-0"
          >
            <Plus size={18} />
          </Button>
        )}
      </div>
    </div>
  )
}