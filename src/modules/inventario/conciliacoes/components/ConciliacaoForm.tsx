import type { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { CampoReadonly } from './CampoReadonly';
import { DatepickerConciliacao } from './DatepickerConciliacao';
import type { ConciliacaoFormData } from '../validators/conciliacao-form.schema';

interface ConciliacaoFormProps {
  form: UseFormReturn<ConciliacaoFormData>;
  unidadeAdministrativaLabel: string;
  tipoConciliacaoLabel: string;
  submitting: boolean;
  disabled?: boolean;
  onSubmit: (values: ConciliacaoFormData) => void | Promise<void>;
}

const TOOLTIP_PERIODO_FINAL = 'Data final do período da conciliação.';

export function ConciliacaoForm({
  form,
  unidadeAdministrativaLabel,
  tipoConciliacaoLabel,
  submitting,
  disabled = false,
  onSubmit,
}: Readonly<ConciliacaoFormProps>) {
  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {rootError && (
          <div className='rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {rootError}
          </div>
        )}

        <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
          <CampoReadonly
            id='conciliacao-unidade-administrativa'
            label='Unidade Administrativa'
            value={unidadeAdministrativaLabel}
          />

          <CampoReadonly id='conciliacao-tipo' label='Tipo' value={tipoConciliacaoLabel} />
        </div>

        <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='periodoFinal'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <DatepickerConciliacao
                    id='conciliacao-periodo-final'
                    label='Período Final'
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled || submitting}
                    invalid={fieldState.invalid}
                    helperText={TOOLTIP_PERIODO_FINAL}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
