import { CircleHelp } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const LABEL_CLASS = 'text-sm font-semibold text-gray-700';
const TOOLTIP_BUTTON_CLASS =
  'inline-flex text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D57]/30 rounded-sm';

function parseDisplayDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return undefined;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
}

function formatIsoToDisplay(date: Date | undefined): string {
  if (!date) return '';
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

interface DatepickerConciliacaoProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  helperText?: string;
}

export function DatepickerConciliacao({
  id,
  label,
  value,
  onChange,
  disabled = false,
  invalid = false,
  ariaLabel = 'Selecionar data',
  placeholder = 'dd/mm/aaaa',
  className,
  helperText,
}: Readonly<DatepickerConciliacaoProps>) {
  const selectedDate = parseDisplayDate(value);

  const handleSelect = (date: Date | undefined) => {
    onChange(formatIsoToDisplay(date));
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className='flex h-6 items-center gap-2'>
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>

        {helperText && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className={TOOLTIP_BUTTON_CLASS}
                aria-label={`Ajuda sobre ${label}`}
                tabIndex={-1}
              >
                <CircleHelp className='h-4 w-4' />
              </button>
            </TooltipTrigger>
            <TooltipContent side='top' sideOffset={6}>
              {helperText}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <DatePicker
        id={id}
        value={selectedDate}
        onChange={handleSelect}
        disabled={disabled}
        invalid={invalid}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
      />
    </div>
  );
}
