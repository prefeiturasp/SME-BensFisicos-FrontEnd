import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus } from 'lucide-react'
import { useNumeroPatrimonial } from '../hooks/useNumeroPatrimonial'

export type LinhaBem = {
  numero_patrimonial: string
  numero_formato_antigo: boolean
  sem_numeracao: boolean
  localizacao: string
}

export type LinhaBemRowProps = Readonly<{
  linha: LinhaBem
  index: number
  linhas: LinhaBem[]
  setLinhas: React.Dispatch<React.SetStateAction<LinhaBem[]>>
  removeLinha: (index: number) => void
  addLinha: () => void
  isLast: boolean
  errors?: Record<string, string>
}>

const INPUT_CLASS =
  'h-11 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700'

export function LinhaBemRow({
  linha,
  index,
  linhas,
  setLinhas,
  removeLinha,
  addLinha,
  isLast,
  errors,
}: LinhaBemRowProps) {

  const numeroHook = useNumeroPatrimonial({
    valor: linha.numero_patrimonial,
    formatoAntigoInicial: linha.numero_formato_antigo,
    semNumeracaoInicial: linha.sem_numeracao,
  })

  return (
    <div className="grid grid-cols-[1.4fr_auto_auto_1fr_auto] gap-6 items-start border rounded p-4">

      {/* NÚMERO PATRIMONIAL */}
      <div className="space-y-1">
        <label htmlFor={`numero_patrimonial_${index}`} className="text-sm font-semibold text-gray-700">
          Número Patrimonial
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
        {errors?.numero_patrimonial ? (
          <p className="text-xs text-red-500">{errors.numero_patrimonial}</p>
        ) : (
          <p className="text-xs text-gray-400">Formato padrão: 000.000000000-0</p>
        )}
      </div>

      {/* FORMATO ANTERIOR */}
      <div className="space-y-1 pt-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={linha.numero_formato_antigo}
            disabled={linha.sem_numeracao}
            onChange={(e) => {
              const newLinhas = [...linhas]
              newLinhas[index].numero_formato_antigo = e.target.checked
              setLinhas(newLinhas)
              if (e.target.checked) {
                numeroHook.ativarFormatoAntigo()
              } else {
                numeroHook.desativarFormatoAntigo()
              }
            }}
          />
          <span>Formato anterior</span>
        </label>
        <p className="text-xs text-gray-400 whitespace-nowrap">
          Se marcado, não valida formato do número (valor livre).
        </p>
      </div>

      {/* SEM NUMERAÇÃO */}
      <div className="space-y-1 pt-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={linha.sem_numeracao}
            onChange={(e) => {
              const newLinhas = [...linhas]
              newLinhas[index].sem_numeracao = e.target.checked

              if (e.target.checked) {
                newLinhas[index].numero_patrimonial = ''
                newLinhas[index].numero_formato_antigo = false
              }

              setLinhas(newLinhas)
            }}
          />
          <span>Sem número patrimonial</span>
        </label>
        <p className="text-xs text-gray-400 whitespace-nowrap">
          Se marcado, o sistema atribui automaticamente.
        </p>
      </div>

      {/* LOCALIZAÇÃO */}
      <div className="space-y-1">
        <label htmlFor={`localizacao_${index}`} className="text-sm font-semibold text-gray-700">
          Localização <span className="text-red-500">*</span>
        </label>
        <Input
          id={`localizacao_${index}`}
          className={INPUT_CLASS}
          placeholder="Localização"
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

      {/* AÇÕES */}
      <div className="flex gap-2 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => removeLinha(index)}
        >
          <Trash2 size={18} />
        </Button>

        {isLast && (
          <Button
            type="button"
            onClick={addLinha}
            className="bg-[#00703C] hover:bg-[#005a30] text-white h-10 w-10 p-0"
          >
            <Plus size={18} />
          </Button>
        )}
      </div>
    </div>
  )
}
