import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Bem } from '@/modules/bem-patrimonial/bem/services/bem.service'

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white'

type BemSelectorRowProps = Readonly<{
  rowId: string
  bem: Bem | null
  allSelectedIds: number[]
  canRemove: boolean
  isLast: boolean
  originDisabled?: boolean
  placeholder?: string
  disabledPlaceholder?: string
  onSelect: (rowId: string, bem: Bem) => void
  onClear: (rowId: string) => void
  onRemove: (rowId: string) => void
  onAdd: () => void
  searchBens: (query: string) => Promise<Bem[]>
}>

export function BemSelectorRow(props: BemSelectorRowProps) {
  const {
    rowId,
    bem,
    allSelectedIds,
    canRemove,
    isLast,
    originDisabled = false,
    placeholder = 'Buscar bem patrimonial',
    disabledPlaceholder = 'Aguarde a unidade de origem',
    onSelect,
    onClear,
    onRemove,
    onAdd,
    searchBens,
  } = props

  const [open, setOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState<Bem[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const updateDropdownDirection = () => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    setOpenUpwards(spaceBelow < 280 && spaceAbove > spaceBelow)
  }

  const search = async (query: string) => {
    setLoading(true)
    try {
      const nextResults = await searchBens(query)
      setResults(nextResults)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return

    setResults([])
    if (inputValue.trim()) {
      void search(inputValue)
      return
    }

    void search('')
  }, [inputValue, open, searchBens])

  const handleFocus = () => {
    if (bem || originDisabled) return

    setOpen(true)
    updateDropdownDirection()
    if (results.length === 0) {
      void search('')
    }
  }

  const handleInputChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputValue(value)
    setOpen(true)
    updateDropdownDirection()

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      void search(value)
    }, 300)
  }

  const handleSelect = (selectedBem: Bem) => {
    onSelect(rowId, selectedBem)
    setInputValue('')
    setOpen(false)
  }

  const handleClear = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onClear(rowId)
    setInputValue('')
    setResults([])
    setOpen(false)
  }

  const renderResults = () => {
    if (loading) {
      return <li className='px-3 py-2 text-sm text-gray-400'>Buscando...</li>
    }

    if (results.length === 0) {
      return <li className='px-3 py-2 text-sm text-gray-400'>Nenhum bem encontrado.</li>
    }

    return results.map((item) => {
      const alreadyAdded = allSelectedIds.includes(item.id)

      return (
        <li key={item.id} className='border-b border-gray-100 last:border-0'>
          <button
            type='button'
            disabled={alreadyAdded}
            onClick={() => handleSelect(item)}
            className={`w-full px-3 py-2 text-left text-sm ${
              alreadyAdded
                ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                : 'cursor-pointer hover:bg-[#2F7D57] hover:text-white'
            }`}
          >
            <span className='mr-2 font-mono'>{item.numero_patrimonial ?? '-'}</span>
            {item.nome}
          </button>
        </li>
      )
    })
  }

  const disabled = originDisabled

  return (
    <div className='flex items-center gap-2'>
      <div className='relative flex-1' ref={ref}>
        {bem ? (
          <div className='flex h-11 w-full items-center justify-between rounded-xs border border-gray-300 bg-white px-3'>
            <span className='truncate text-sm text-gray-700'>
              <span className='mr-2 font-mono text-gray-500'>{bem.numero_patrimonial ?? '-'}</span>
              {bem.nome}
            </span>
            <div className='ml-2 flex shrink-0 items-center gap-1'>
              <button
                type='button'
                onClick={handleClear}
                className='p-1 text-gray-400 hover:text-gray-600'
                aria-label='Limpar bem selecionado'
              >
                <X size={14} />
              </button>
              <ChevronDown size={14} className='text-gray-400' />
            </div>
          </div>
        ) : (
          <div className='relative'>
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              placeholder={disabled ? disabledPlaceholder : placeholder}
              disabled={disabled}
              className={`${INPUT_CLASS} pr-8 ${
                disabled ? 'cursor-not-allowed bg-gray-50 text-gray-400' : ''
              }`}
              aria-label='Buscar bem patrimonial'
            />
            <ChevronDown
              size={14}
              className='pointer-events-none absolute right-3 top-3.5 text-gray-400'
            />

            {open && !disabled ? (
              <ul
                className={`absolute left-0 right-0 z-20 max-h-56 overflow-auto rounded border border-gray-300 bg-white shadow-lg ${
                  openUpwards ? 'bottom-full mb-1' : 'top-full mt-0'
                }`}
              >
                {renderResults()}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {isLast ? (
        <Button
          type='button'
          onClick={onAdd}
          variant='outline'
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded border-[#2F7D57] bg-white text-[#2F7D57] transition-colors hover:bg-[#2F7D57] hover:text-white'
          aria-label='Adicionar item'
        >
          <Plus size={18} />
        </Button>
      ) : (
        <div className='w-10 shrink-0' />
      )}

      <Button
        type='button'
        onClick={() => onRemove(rowId)}
        disabled={!canRemove}
        variant='outline'
        className='flex h-10 w-10 shrink-0 items-center justify-center rounded border-[#2F7D57] bg-white text-[#2F7D57] transition-colors hover:bg-[#2F7D57] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2F7D57]'
        aria-label='Remover item'
      >
        <Trash2 size={16} />
      </Button>
    </div>
  )
}
