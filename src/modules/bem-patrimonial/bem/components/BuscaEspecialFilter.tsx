import { ChevronDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type BuscaEspecialFilterProps = Readonly<{
  id: string
  buscaGeralUos: boolean
  bensBaixados: boolean
  onChangeBuscaGeralUos: (checked: boolean) => void
  onChangeBensBaixados: (checked: boolean) => void
  triggerClassName?: string
}>

const DEFAULT_TRIGGER_CLASS =
  'h-9 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center'

// Mesma classe-base usada pelo SelectTrigger (components/ui/select.tsx),
// para que o trigger da Busca Especial fique visualmente idêntico
// (shadow, borda, foco) aos demais filtros de listagem (Status/Unidade).
const SELECT_TRIGGER_BASE_CLASS =
  "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit cursor-pointer items-center justify-between gap-2 border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

export function BuscaEspecialFilter({
  id,
  buscaGeralUos,
  bensBaixados,
  onChangeBuscaGeralUos,
  onChangeBensBaixados,
  triggerClassName,
}: BuscaEspecialFilterProps) {
  const selecionadosCount = [buscaGeralUos, bensBaixados].filter(
    Boolean
  ).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type='button'
          className={cn(
            SELECT_TRIGGER_BASE_CLASS,
            triggerClassName ?? DEFAULT_TRIGGER_CLASS
          )}
        >
          <span className='truncate text-gray-700'>
            {selecionadosCount > 0
              ? `${selecionadosCount} selecionado(s)`
              : 'Selecione'}
          </span>
          <ChevronDown size={16} className='text-gray-500 shrink-0' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-[var(--radix-popover-trigger-width)] p-1'
      >
        <label className='flex items-center gap-2 rounded-xs px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer'>
          <Checkbox
            checked={buscaGeralUos}
            onCheckedChange={checked =>
              onChangeBuscaGeralUos(checked === true)
            }
          />
          <span>Busca geral em todas as UOs</span>
        </label>
        <label className='flex items-center gap-2 rounded-xs px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer'>
          <Checkbox
            checked={bensBaixados}
            onCheckedChange={checked =>
              onChangeBensBaixados(checked === true)
            }
          />
          <span>Bens Baixados</span>
        </label>
      </PopoverContent>
    </Popover>
  )
}