import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type Props = Readonly<{
  grupos: any[]
  value: string
  onChange: (value: string) => void
}>

export function EscopoFilterDropdown({ grupos, value, onChange }: Props) {
  const [open, setOpen] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)

  const close = () => {
    setOpen(false)
    setFilter('')
  }

  const filteredGroups = React.useMemo(() => {
    if (!filter) return grupos

    return grupos
      .map(grupo => ({
        ...grupo,
        uas: grupo.uas.filter((ua: any) =>
          ua.label.toLowerCase().includes(filter.toLowerCase())
        )
      }))
      .filter(grupo => {
            const matchUO =
                (grupo.uo?.label ?? '')
                .toLowerCase()
                .includes(filter.toLowerCase())
            const matchUA = grupo.uas.length > 0
            if (matchUO) return true
            if (matchUA) return true
            return false
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

  const selectedLabel = React.useMemo(() => {
    if (value === 'todas') return 'Todas'

    const [tipo, id] = value.split(':')

    for (const grupo of grupos) {
      if (tipo === 'uo' && String(grupo.uo.id) === id) {
        return grupo.uo.label
      }

      if (tipo === 'ua') {
        const ua = grupo.uas.find(
          (u: any) => String(u.unidade_administrativa_id) === id
        )
        if (ua) return ua.label
      }
    }

    return 'Selecionar'
  }, [value, grupos])

  return (
    <div ref={dropdownRef} className='relative w-full'>
      <button
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
            {filteredGroups.length === 0 && (
              <div className='px-3 py-2 text-sm text-gray-500'>
                Nenhuma unidade encontrada
              </div>
            )}

            {filteredGroups.map(grupo => (
              <Collapsible key={grupo.uo.id} defaultOpen>
                <div className='flex items-center justify-between px-2 py-1'>
                  <button
                    type='button'
                    onClick={() => {
                      onChange(`uo:${grupo.uo.id}`)
                      close()
                    }}
                    className={`
                      flex-1 text-left text-sm font-semibold px-2 py-1 rounded hover:bg-gray-50
                      ${value === `uo:${grupo.uo.id}` ? 'bg-green-50 text-green-700' : ''}
                    `}
                  >
                    {grupo.uo.label}
                  </button>

                  <CollapsibleTrigger asChild>
                    <button className='h-8 w-8 flex items-center justify-center'>
                      <ChevronDown className='size-4 text-gray-500' />
                    </button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  {grupo.uas.map((ua: any) => (
                    <button
                      key={ua.id}
                      type='button'
                      onClick={() => {
                        onChange(`ua:${ua.unidade_administrativa_id}`)
                        close()
                      }}
                      className={`
                        w-full text-left px-5 py-1.5 text-sm hover:bg-gray-50
                        ${value === `ua:${ua.unidade_administrativa_id}` ? 'bg-green-50 text-green-700' : 'text-gray-600'}
                      `}
                    >
                      {ua.label}
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}

            <button
              type='button'
              onClick={() => {
                onChange('todas')
                close()
              }}
              className='w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gray-50'
            >
              Todas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}