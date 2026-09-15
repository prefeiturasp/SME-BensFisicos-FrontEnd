import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ValidatedField } from '@/components/form-fields/ValidatedField'
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

export type CampoLinhaBem = keyof LinhaBem

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
  /**
   * Limpeza padronizada do erro inline: só o campo alterado é limpo, na
   * digitação — o mesmo comportamento de `shouldValidate` do react-hook-form
   * usado nas telas migradas.
   */
  onLimparErro?: (index: number, campo: CampoLinhaBem) => void
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
  onLimparErro,
}: LinhaBemRowProps) {

  const numeroHook = useNumeroPatrimonial({
    valor: linha.numero_patrimonial,
    formatoAntigoInicial: linha.numero_formato_antigo,
    semNumeracaoInicial: linha.sem_numeracao,
  })

  // O Radix Select não aceita SelectItem com value="" (lança erro em tempo
  // de execução — a string vazia é reservada internamente para representar
  // "nenhuma seleção"/placeholder). Por isso usamos um valor sentinela só
  // para o item "Selecione", convertendo de/para "" (o valor "sem seleção"
  // vindo de valorSelectFormato) na fronteira deste componente.
  const SELECIONE_SENTINEL = '__selecione__'

  const valorFormato = valorSelectFormato(
    linha.numero_formato_antigo,
    linha.sem_numeracao
  )
  const valorFormatoSelect = valorFormato === '' ? SELECIONE_SENTINEL : valorFormato

  const atualizarCampo = (campo: CampoLinhaBem, valor: string) => {
    const newLinhas = [...linhas]
    newLinhas[index] = { ...newLinhas[index], [campo]: valor }
    setLinhas(newLinhas)
    onLimparErro?.(index, campo)
  }

  const handleFormatoChange = (valorSelecionado: string) => {
    const valor = valorSelecionado === SELECIONE_SENTINEL ? '' : valorSelecionado
    const newLinhas = [...linhas]
    const atual = { ...newLinhas[index] }

    if (valor === 'formato_anterior') {
      atual.numero_formato_antigo = true
      atual.sem_numeracao = false
      numeroHook.ativarFormatoAntigo()
    } else if (valor === 'sem_numeracao') {
      atual.numero_formato_antigo = false
      atual.sem_numeracao = true
      atual.numero_patrimonial = ''
    } else {
      atual.numero_formato_antigo = false
      atual.sem_numeracao = false
      numeroHook.desativarFormatoAntigo()
    }

    newLinhas[index] = atual
    setLinhas(newLinhas)
    onLimparErro?.(index, 'numero_patrimonial')
  }

  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_auto] gap-6 items-start border rounded p-4">

      {/* NÚMERO PATRIMONIAL */}
      <ValidatedField
        label="Número Patrimonial"
        htmlFor={`numero_patrimonial_${index}`}
        error={errors?.numero_patrimonial}
        required
      >
        <Input
          id={`numero_patrimonial_${index}`}
          className={INPUT_CLASS}
          placeholder="000.000000000-0"
          value={linha.numero_patrimonial}
          disabled={numeroHook.disabled}
          aria-invalid={!!errors?.numero_patrimonial}
          onChange={(e) =>
            atualizarCampo('numero_patrimonial', numeroHook.applyMask(e.target.value))
          }
        />
      </ValidatedField>

      {/* FORMATO */}
      <ValidatedField
        label={
          <span className="flex items-center gap-1.5">
            Formato
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
          </span>
        }
        htmlFor={`formato_${index}`}
      >
        <Select value={valorFormatoSelect} onValueChange={handleFormatoChange}>
          <SelectTrigger id={`formato_${index}`} className={INPUT_CLASS}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECIONE_SENTINEL}>Selecione</SelectItem>
            <SelectItem value="formato_anterior">Formato anterior</SelectItem>
            <SelectItem value="sem_numeracao">Sem número patrimonial</SelectItem>
          </SelectContent>
        </Select>
      </ValidatedField>

      {/* LOCALIZAÇÃO */}
      <ValidatedField
        label="Localização"
        htmlFor={`localizacao_${index}`}
        error={errors?.localizacao}
        required
      >
        <Input
          id={`localizacao_${index}`}
          className={INPUT_CLASS}
          placeholder="Insira a localização do bem"
          value={linha.localizacao}
          aria-invalid={!!errors?.localizacao}
          onChange={(e) => atualizarCampo('localizacao', e.target.value)}
        />
      </ValidatedField>

      {/* NÚMERO DO PROCESSO DE INCORPORAÇÃO */}
      <ValidatedField
        label="Número do Processo de Incorporação"
        htmlFor={`numero_processo_${index}`}
        error={errors?.numero_processo}
      >
        <Input
          id={`numero_processo_${index}`}
          className={INPUT_CLASS}
          placeholder="Insira o nº do processo de incorporação"
          value={linha.numero_processo}
          aria-invalid={!!errors?.numero_processo}
          onChange={(e) => atualizarCampo('numero_processo', e.target.value)}
        />
      </ValidatedField>

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
