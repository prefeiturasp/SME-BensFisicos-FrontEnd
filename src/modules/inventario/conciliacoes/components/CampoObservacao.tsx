import { CircleHelp } from 'lucide-react';
import type { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const LABEL_CLASS = 'text-sm font-semibold text-gray-700';
const OPTIONAL_CLASS = 'ml-1 text-xs font-normal text-gray-500';
const HELPER_BUTTON_CLASS =
  'inline-flex text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7D57]/30 rounded-sm';

const TEXTAREA_CLASS =
  'min-h-[120px] w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57] focus:ring-2 focus:ring-[#2F7D57]/30';

const HELPER_TEXT =
  'Informação adicional que será vinculada ao registro desta ocorrência.';
const PLACEHOLDER = 'Adicione uma observação dessa ocorrência...';

interface CampoObservacaoProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  disabled?: boolean;
}

export function CampoObservacao<T extends FieldValues>({
  form,
  name,
  disabled = false,
}: Readonly<CampoObservacaoProps<T>>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className='flex h-6 items-center gap-2'>
            <label htmlFor={String(name)} className={cn(LABEL_CLASS)}>
              Observação
            </label>
            <span className={OPTIONAL_CLASS}>(opcional)</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  className={HELPER_BUTTON_CLASS}
                  aria-label='Ajuda sobre Observação'
                  tabIndex={-1}
                >
                  <CircleHelp className='h-4 w-4' />
                </button>
              </TooltipTrigger>
              <TooltipContent side='top' sideOffset={6}>
                {HELPER_TEXT}
              </TooltipContent>
            </Tooltip>
          </div>
          <FormControl>
            <Textarea
              id={String(name)}
              data-testid='ocorrencia-observacao'
              placeholder={PLACEHOLDER}
              value={(field.value as string | undefined) ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className={cn(TEXTAREA_CLASS, fieldState.invalid && 'border-red-500')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
