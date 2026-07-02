import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  ariaLabel?: string;
  id?: string;
  showTodayButton?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  invalid = false,
  className,
  ariaLabel = 'Selecionar data',
  id,
  showTodayButton = true,
}: Readonly<DatePickerProps>) {
  const [open, setOpen] = React.useState(false);
  const labelText = value ? format(value, 'dd/MM/yyyy', { locale: ptBR }) : placeholder;

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  const handleTodayClick = () => {
    onChange?.(new Date());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type='button'
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-xs border border-gray-300 bg-white px-4 text-left text-sm text-gray-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D57]/30 disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-gray-400',
            invalid && 'border-red-500 focus-visible:ring-red-500/30',
            className,
          )}
        >
          <span className='truncate'>{labelText}</span>
          <CalendarIcon className='h-5 w-5 shrink-0 text-gray-500' />
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start'>
        <Calendar selected={value} onSelect={handleSelect} disabled={disabled} />
        {showTodayButton && (
          <div className='flex justify-end border-t border-gray-200 px-3 pb-3 pt-2'>
            <button
              type='button'
              onClick={handleTodayClick}
              className='cursor-pointer text-sm font-semibold text-[#00703C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D57]/30 rounded-sm'
            >
              Hoje
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
