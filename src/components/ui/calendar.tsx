import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export type DatePickerDisabled =
  | boolean
  | Date
  | Date[]
  | ((date: Date) => boolean);

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: DatePickerDisabled;
  className?: string;
  month?: Date;
  onMonthChange?: (date: Date) => void;
}

function buildMonthDays(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

function getMonthLabel(date: Date) {
  const formatted = format(date, 'MMMM yyyy', { locale: ptBR });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
  month: controlledMonth,
  onMonthChange,
}: Readonly<CalendarProps>) {
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (disabled === undefined || disabled === false) return false;
      if (disabled === true) return true;
      if (typeof disabled === 'function') return disabled(date);
      if (disabled instanceof Date) return isSameDay(date, disabled);
      if (Array.isArray(disabled)) {
        return disabled.some((d) => (d instanceof Date ? isSameDay(d, date) : false));
      }
      return false;
    },
    [disabled],
  );

  const [internalMonth, setInternalMonth] = React.useState<Date>(() => selected ?? new Date());
  const currentMonth = controlledMonth ?? internalMonth;

  const setMonth = (date: Date) => {
    if (!controlledMonth) {
      setInternalMonth(date);
    }
    onMonthChange?.(date);
  };

  const goPrevMonth = () => {
    setMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = React.useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const monthLabel = getMonthLabel(currentMonth);

  const handleSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    onSelect?.(date);
  };

  return (
    <div className={cn('p-3', className)}>
      <div className='mb-3 flex items-center justify-between'>
        <div className='inline-flex items-center gap-1 text-sm font-semibold text-gray-700 capitalize'>
          {monthLabel}
          <ChevronDown className='h-4 w-4' />
        </div>
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={goPrevMonth}
            aria-label='Mês anterior'
            className='h-7 w-7 text-gray-700 hover:bg-[#EAF5EF] hover:text-[#2F7D57]'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={goNextMonth}
            aria-label='Próximo mês'
            className='h-7 w-7 text-gray-700 hover:bg-[#EAF5EF] hover:text-[#2F7D57]'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-7 text-center text-xs text-gray-500'>
        {WEEK_DAYS.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className='flex h-9 items-center justify-center font-semibold text-[0.7rem] uppercase tracking-wide'
          >
            {day}
          </span>
        ))}

        {days.map((date) => {
          const inMonth = isSameMonth(date, currentMonth);
          const isSelected = selected ? isSameDay(date, selected) : false;
          const isCurrentDay = isToday(date);
          const isDisabledDay = isDateDisabled(date);

          const baseClass =
            'mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D57]/30';
          const stateClass = isSelected
            ? 'bg-[#2F7D57] font-semibold text-white hover:bg-[#2F7D57]'
            : isCurrentDay
              ? 'border border-[#2F7D57] font-semibold text-[#00703C]'
              : 'text-gray-700 hover:bg-[#EAF5EF] hover:text-[#2F7D57]';
          const outsideClass = !inMonth && !isSelected ? 'text-gray-300' : '';
          const disabledClass = isDisabledDay
            ? 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-gray-700'
            : '';

          return (
            <button
              type='button'
              key={date.toISOString()}
              disabled={isDisabledDay}
              onClick={() => handleSelect(date)}
              aria-label={format(date, 'PPP', { locale: ptBR })}
              className={cn(baseClass, stateClass, outsideClass, disabledClass)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
Calendar.displayName = 'Calendar';
