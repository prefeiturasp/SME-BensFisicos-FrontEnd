import type { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FieldLabelWithTooltip } from './FieldLabelWithTooltip';
import { TEXTAREA_CLASS } from '../utils/form-styles';

const HELPER_TEXT =
  'Informação adicional que será vinculada ao registro desta ocorrência.';
const PLACEHOLDER = 'Adicione uma observação dessa ocorrência...';
const LABEL = 'Observação';

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
          <FieldLabelWithTooltip
            htmlFor={String(name)}
            label={LABEL}
            tooltip={HELPER_TEXT}
            optional
          />
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
