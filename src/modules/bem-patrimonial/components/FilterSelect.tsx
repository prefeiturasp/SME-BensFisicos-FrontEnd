import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type SelectOption = {
  value: string
  label: string
}

type FilterSelectProps = Readonly<{
  label: string
  value: string
  placeholder: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}>

const INPUT_CLASS =
  'h-10 w-full rounded-xs border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]'

export function FilterSelect(props: FilterSelectProps) {
  const { label, value, placeholder, options, onChange, className } = props

  return (
    <label className={cn('flex h-full min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700', className)}>
      <span className='flex min-h-[2.75rem] items-end leading-tight'>{label}</span>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          onChange(nextValue)
        }}
      >
        <SelectTrigger className={INPUT_CLASS}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
