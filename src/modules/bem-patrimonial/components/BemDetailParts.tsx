import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

type BemDetailFieldProps = Readonly<{
  label: string
  children: ReactNode
  className?: string
}>

type BemItemRowProps = Readonly<{
  label: string
  className?: string
  showChevron?: boolean
}>

export function BemDetailField(props: BemDetailFieldProps) {
  const { label, children, className } = props

  return (
    <div className={cn('space-y-1', className)}>
      <span className='text-sm font-semibold text-gray-700'>{label}</span>
      <div className='text-sm text-gray-700'>{children}</div>
    </div>
  )
}

export function BemItemRow(props: BemItemRowProps) {
  const { label, className, showChevron = false } = props

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700',
        className,
      )}
    >
      <span className='truncate pr-4'>{label}</span>
      {showChevron ? <ChevronDown className='size-4 shrink-0 text-gray-400' /> : null}
    </div>
  )
}
