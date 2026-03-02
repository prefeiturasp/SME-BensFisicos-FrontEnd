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

export type LinhaBemRowProps = {
  linha: LinhaBem
  index: number
  linhas: LinhaBem[]
  setLinhas: React.Dispatch<React.SetStateAction<LinhaBem[]>>
  removeLinha: (index: number) => void
  addLinha: () => void
  isLast: boolean
}

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
}: LinhaBemRowProps) {

  const numeroHook = useNumeroPatrimonial({
    valor: linha.numero_patrimonial,
    formatoAntigoInicial: linha.numero_formato_antigo,
    semNumeracaoInicial: linha.sem_numeracao,
  })

  return (
    <div className="grid grid-cols-[1.2fr_auto_auto_1fr_auto] gap-4 items-end border rounded p-4">

      <Input
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={linha.numero_formato_antigo}
          disabled={linha.sem_numeracao}
          onChange={(e) => {
            const newLinhas = [...linhas]
            newLinhas[index].numero_formato_antigo = e.target.checked
            setLinhas(newLinhas)
            numeroHook.handleFormatoAntigoChange(e.target.checked)
          }}
        />
        Formato anterior
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={linha.sem_numeracao}
          onChange={(e) => {
            const newLinhas = [...linhas]
            newLinhas[index].sem_numeracao = e.target.checked
            setLinhas(newLinhas)
            if (e.target.checked) {
                const newLinhas = [...linhas]
                newLinhas[index].numero_patrimonial = ''
                newLinhas[index].numero_formato_antigo = false
                setLinhas(newLinhas)
                }
          }}
        />
        Sem número patrimonial
      </label>

      <Input
        className={INPUT_CLASS}
        placeholder="Localização"
        value={linha.localizacao}
        onChange={(e) => {
          const newLinhas = [...linhas]
          newLinhas[index].localizacao = e.target.value
          setLinhas(newLinhas)
        }}
      />

      <div className="flex gap-2">
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