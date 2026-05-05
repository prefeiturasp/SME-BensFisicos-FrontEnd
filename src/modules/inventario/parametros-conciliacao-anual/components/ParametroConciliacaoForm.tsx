import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ParametroConciliacaoAnualFormData } from '../validators/parametro-conciliacao-anual.schema';

interface Props {
  form: UseFormReturn<ParametroConciliacaoAnualFormData>;
  unidadeOrcamentariaLabel: string;
  submitting: boolean;
  disabled?: boolean;
  onSubmit: (values: ParametroConciliacaoAnualFormData) => void | Promise<void>;
}

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 bg-white px-5 text-sm text-gray-700';

const READONLY_INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 bg-[#F5F5F5] px-5 text-sm text-gray-700 disabled:opacity-100';

const HELP_CLASS = 'mt-1 text-xs text-gray-500';
const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function toIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseDisplayDate(value: string) {
  const [day, month, year] = value.split('/').map(Number);

  if (!day || !month || !year) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDisplayDate(date: Date) {
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function DateInput({
  value,
  onChange,
  disabled,
  invalid,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid?: boolean;
}>) {
  const selectedDate = parseDisplayDate(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const selectDate = (date: Date) => {
    onChange(formatDisplayDate(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setOpen(false);
  };

  const changeMonth = (amount: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div className='relative' ref={containerRef}>
      <Input
        type='text'
        inputMode='numeric'
        value={value}
        placeholder='dd/mm/aaaa'
        onChange={(event) => onChange(maskDate(event.target.value))}
        disabled={disabled}
        className={`${INPUT_CLASS} pr-12 ${invalid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
      />
      <button
        type='button'
        aria-label='Selecionar data'
        className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600 hover:text-[#2F7D57] disabled:cursor-not-allowed disabled:opacity-50'
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <Calendar size={22} />
      </button>

      {open && !disabled && (
        <div className='absolute left-0 top-[calc(100%+8px)] z-30 w-60 rounded-md border border-gray-200 bg-white p-4 shadow-xl'>
          <div className='mb-3 flex items-center justify-between'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => changeMonth(-1)}
              aria-label='Mês anterior'
            >
              <ChevronLeft size={20} />
            </Button>

            <div className='inline-flex items-center gap-1 text-sm font-medium capitalize text-gray-700'>
              {monthLabel}
              <ChevronDown size={16} />
            </div>

            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => changeMonth(1)}
              aria-label='Próximo mês'
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          <div className='grid grid-cols-7 gap-1 text-center text-xs text-gray-500'>
            {WEEK_DAYS.map((day, index) => (
              <span key={`${day}-${index}`} className='py-1'>
                {day}
              </span>
            ))}

            {days.map((date) => {
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDate && toIsoDate(date) === toIsoDate(selectedDate);
              const isToday = toIsoDate(date) === toIsoDate(new Date());

              return (
                <button
                  type='button'
                  key={toIsoDate(date)}
                  className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-sm transition ${
                    isSelected
                      ? 'bg-[#2F7D57] text-white'
                      : 'text-gray-700 hover:bg-[#EAF5EF] hover:text-[#2F7D57]'
                  } ${!isCurrentMonth ? 'text-gray-300' : ''} ${
                    isToday && !isSelected ? 'border border-[#2F7D57]' : ''
                  }`}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className='mt-3 flex justify-end'>
            <button
              type='button'
              className='cursor-pointer text-sm font-semibold text-[#00703C]'
              onClick={() => selectDate(new Date())}
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ParametroConciliacaoForm({
  form,
  unidadeOrcamentariaLabel,
  submitting,
  disabled = false,
  onSubmit,
}: Readonly<Props>) {
  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {rootError && (
          <div className='rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {rootError}
          </div>
        )}

        <div className='grid grid-cols-1 items-start gap-8 lg:grid-cols-2'>
          <FormItem>
            <div className='flex h-6 items-center'>
              <FormLabel className='text-sm font-semibold text-gray-700'>
                Unidade Orçamentária
              </FormLabel>
            </div>
            <FormControl>
              <Input value={unidadeOrcamentariaLabel} disabled className={READONLY_INPUT_CLASS} />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name='anoReferencia'
            render={({ field }) => (
              <FormItem>
                <div className='flex h-6 items-center'>
                  <FormLabel className='text-sm font-semibold text-gray-700'>
                    Ano de Referência
                  </FormLabel>
                </div>
                <FormControl>
                  <Input
                    inputMode='numeric'
                    maxLength={4}
                    placeholder='Ex: 2026'
                    className={INPUT_CLASS}
                    disabled={disabled || submitting}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(event.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                  />
                </FormControl>
                {!form.formState.errors.anoReferencia && (
                  <p className={HELP_CLASS}>
                    Ano da conciliação anual ao qual este parâmetro se refere.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 items-start gap-8 lg:grid-cols-2'>
          <FormField
            control={form.control}
            name='periodoInicial'
            render={({ field, fieldState }) => (
              <FormItem>
                <div className='flex h-6 items-center'>
                  <FormLabel className='text-sm font-semibold text-gray-700'>
                    Período Inicial Permitido
                  </FormLabel>
                </div>
                <FormControl>
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled || submitting}
                    invalid={fieldState.invalid}
                  />
                </FormControl>
                {!fieldState.error && (
                  <p className={HELP_CLASS}>
                    Data inicial em que conciliações anuais podem ser criadas/fechadas.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='periodoFinal'
            render={({ field, fieldState }) => (
              <FormItem>
                <div className='flex h-6 items-center'>
                  <FormLabel className='text-sm font-semibold text-gray-700'>
                    Período Final Permitido
                  </FormLabel>
                </div>
                <FormControl>
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled || submitting}
                    invalid={fieldState.invalid}
                  />
                </FormControl>
                {!fieldState.error && (
                  <p className={HELP_CLASS}>
                    Data final em que conciliações anuais podem ser criadas/fechadas.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='ativo'
          render={({ field, fieldState }) => (
            <FormItem className='max-w-md'>
              <div className='flex h-6 items-center'>
                <FormLabel className='text-sm font-semibold text-gray-700'>Status</FormLabel>
              </div>
              <div
                className={`flex items-center gap-3 rounded-xs px-2 py-2 ${
                  fieldState.invalid ? 'border border-red-500' : ''
                }`}
              >
                <Checkbox
                  checked={field.value}
                  disabled={disabled || submitting}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                />
                <span className='text-sm text-gray-700'>Ativo</span>
              </div>
              {!fieldState.error && <p className={HELP_CLASS}>Apenas um parâmetro ativo por ano.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
