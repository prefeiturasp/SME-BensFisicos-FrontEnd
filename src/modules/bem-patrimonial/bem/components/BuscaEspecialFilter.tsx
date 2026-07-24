import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type BuscaEspecialFilterProps = Readonly<{
  buscaGeralUos: boolean
  bensBaixados: boolean
  onChangeBuscaGeralUos: (checked: boolean) => void
  onChangeBensBaixados: (checked: boolean) => void
}>

const TRIGGER_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center justify-between gap-2'

export function BuscaEspecialFilter({
  buscaGeralUos,
  bensBaixados,
  onChangeBuscaGeralUos,
  onChangeBensBaixados,
}: BuscaEspecialFilterProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selecionadosCount = [buscaGeralUos, bensBaixados].filter(
    Boolean
  ).length

  return (
    <div className='flex flex-col gap-2' ref={containerRef}>
      <span
        id='busca-especial-label'
        className='text-sm font-semibold text-gray-700'
      >
        Busca Especial
      </span>

      <div className='relative'>
        <button
          type='button'
          className={TRIGGER_CLASS}
          aria-haspopup='true'
          aria-expanded={open}
          aria-labelledby='busca-especial-label'
          onClick={() => setOpen(prev => !prev)}
        >
          <span className='truncate text-gray-700'>
            {selecionadosCount > 0
              ? `${selecionadosCount} selecionado(s)`
              : 'Selecione'}
          </span>
          <ChevronDown size={16} className='text-gray-500 shrink-0' />
        </button>

        {open && (
          <div
            aria-labelledby='busca-especial-label'
            className='absolute z-10 mt-1 w-full rounded-xs border border-gray-300 bg-white shadow-md'
          >
            <label className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer'>
              <input
                type='checkbox'
                checked={buscaGeralUos}
                onChange={e => onChangeBuscaGeralUos(e.target.checked)}
                className='h-4 w-4 accent-[#00703C]'
              />
              <span>Busca geral em todas as UOs</span>
            </label>
            <label className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer'>
              <input
                id='bens-baixados'
                type='checkbox'
                checked={bensBaixados}
                onChange={e => onChangeBensBaixados(e.target.checked)}
                className='h-4 w-4 accent-[#00703C]'
              />
              <span>Bens Baixados</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}