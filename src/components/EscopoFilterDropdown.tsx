import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type Ua = {
  id: number | string
  label: string
  unidade_administrativa_id: number | string
}

type Grupo = {
  uo: {
    id: number | string
    label: string
  }
  uas: Ua[]
}

type Props = Readonly<{
  id?: string
  grupos: Grupo[]
  /**
   * IDs das Unidades Administrativas selecionadas.
   * Lista vazia representa "Todas as UAs" (sem restrição individual).
   */
  value: string[]
  onChange: (uaIds: string[]) => void
}>

const TODAS_LABEL = 'Todas as UAs'

export function EscopoFilterDropdown({ id, grupos, value, onChange }: Props) {
  const [open, setOpen] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)

  const close = () => {
    setOpen(false)
    setFilter('')
  }

  const selectedSet = React.useMemo(() => new Set(value), [value])

  const filteredGroups = React.useMemo(() => {
    if (!filter) return grupos

    const termo = filter.toLowerCase()

    return grupos
      .map(grupo => ({
        ...grupo,
        uas: grupo.uas.filter(ua => ua.label.toLowerCase().includes(termo)),
      }))
      .filter(grupo => {
        const matchUO = (grupo.uo?.label ?? '').toLowerCase().includes(termo)
        const matchUA = grupo.uas.length > 0
        return matchUO || matchUA
      })
  }, [filter, grupos])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(event.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isTodas = value.length === 0

  const selectedLabel = React.useMemo(() => {
    if (isTodas) return TODAS_LABEL

    const labelsSelecionados: string[] = []
    for (const grupo of grupos) {
      for (const ua of grupo.uas) {
        if (selectedSet.has(String(ua.unidade_administrativa_id))) {
          labelsSelecionados.push(ua.label)
        }
      }
    }

    if (labelsSelecionados.length === 0) return 'Selecionar'
    if (labelsSelecionados.length === 1) return labelsSelecionados[0]
    return `${labelsSelecionados.length} unidades selecionadas`
  }, [isTodas, grupos, selectedSet])

  const toggleUa = (uaId: string) => {
    const next = new Set(selectedSet)
    if (next.has(uaId)) {
      next.delete(uaId)
    } else {
      next.add(uaId)
    }
    onChange(Array.from(next))
  }

  const toggleGrupo = (grupo: Grupo) => {
    const idsGrupo = grupo.uas.map(ua => String(ua.unidade_administrativa_id))
    const todasMarcadas = idsGrupo.every(uaId => selectedSet.has(uaId))

    const next = new Set(selectedSet)
    if (todasMarcadas) {
      idsGrupo.forEach(uaId => next.delete(uaId))
    } else {
      idsGrupo.forEach(uaId => next.add(uaId))
    }
    onChange(Array.from(next))
  }

  const selecionarTodas = () => {
    // "Todas as UAs" = sem seleção individual (lista vazia).
    onChange([])
    close()
  }

  const grupoEstado = (grupo: Grupo): 'todos' | 'parcial' | 'nenhum' => {
    const idsGrupo = grupo.uas.map(ua => String(ua.unidade_administrativa_id))
    if (idsGrupo.length === 0) return 'nenhum'
    const marcadas = idsGrupo.filter(uaId => selectedSet.has(uaId)).length
    if (marcadas === 0) return 'nenhum'
    if (marcadas === idsGrupo.length) return 'todos'
    return 'parcial'
  }

  return (
    <div ref={dropdownRef} className='relative w-full'>
      <button
        id={id}
        type='button'
        onClick={() => setOpen(prev => !prev)}
        className='h-9 w-full border border-gray-300 rounded-xs px-4 text-sm bg-white flex items-center justify-between'
      >
        <span className='truncate'>{selectedLabel}</span>
        <ChevronDown className='size-4 text-gray-500' />
      </button>

      {open && (
        <div className='absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto border border-gray-200 bg-white rounded-xs shadow-xl'>
          <div className='p-2 border-b'>
            <Input
              placeholder='Buscar unidade'
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className='h-8 text-sm'
            />
          </div>

          <div className='p-1'>
            <button
              type='button'
              onClick={selecionarTodas}
              className={`
                flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold rounded hover:bg-gray-50
                ${isTodas ? 'bg-green-50 text-green-700' : 'text-gray-700'}
              `}
            >
              <Checkbox
                checked={isTodas}
                aria-hidden='true'
                tabIndex={-1}
                className='pointer-events-none'
              />
              {TODAS_LABEL}
            </button>

            {filteredGroups.length === 0 && (
              <div className='px-3 py-2 text-sm text-gray-500'>
                Nenhuma unidade encontrada
              </div>
            )}

            {filteredGroups.map(grupo => {
              const estado = grupoEstado(grupo)
              return (
                <Collapsible key={grupo.uo.id} defaultOpen>
                  <div className='flex items-center justify-between px-2 py-1'>
                    <label
                      className={`
                        flex flex-1 items-center gap-2 text-left text-sm font-semibold px-2 py-1 rounded hover:bg-gray-50 cursor-pointer
                        ${estado === 'todos' ? 'bg-green-50 text-green-700' : ''}
                      `}
                    >
                      <Checkbox
                        checked={estado === 'todos'}
                        data-parcial={estado === 'parcial' ? 'true' : undefined}
                        onCheckedChange={() => toggleGrupo(grupo)}
                        disabled={grupo.uas.length === 0}
                        className={
                          estado === 'parcial'
                            ? 'data-[parcial=true]:bg-[#2F7D57] data-[parcial=true]:border-[#2F7D57] data-[parcial=true]:opacity-60'
                            : undefined
                        }
                      />
                      {grupo.uo.label}
                    </label>

                    <CollapsibleTrigger asChild>
                      <button
                        type='button'
                        className='h-8 w-8 flex items-center justify-center'
                        aria-label={`Expandir unidades de ${grupo.uo.label}`}
                      >
                        <ChevronDown className='size-4 text-gray-500' />
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    {grupo.uas.map(ua => {
                      const uaId = String(ua.unidade_administrativa_id)
                      const checked = selectedSet.has(uaId)
                      return (
                        <label
                          key={ua.id}
                          className={`
                            flex w-full items-center gap-2 px-5 py-1.5 text-sm hover:bg-gray-50 cursor-pointer
                            ${checked ? 'bg-green-50 text-green-700' : 'text-gray-600'}
                          `}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleUa(uaId)}
                          />
                          {ua.label}
                        </label>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>

          {!isTodas && (
            <div className='p-2 border-t flex justify-end'>
              <button
                type='button'
                onClick={selecionarTodas}
                className='text-xs font-semibold text-gray-500 hover:text-gray-700'
              >
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export type { Grupo as EscopoGrupo, Ua as EscopoUa }