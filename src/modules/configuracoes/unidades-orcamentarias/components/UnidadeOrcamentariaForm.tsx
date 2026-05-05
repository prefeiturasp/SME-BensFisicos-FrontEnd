import type { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { StatusSelectField } from '@/components/form-fields/StatusSelectField';
import { UppercaseTextField } from '@/components/form-fields/UppercaseTextField';
import { Input } from '@/components/ui/input';
import type { UnidadeOrcamentariaFormData } from '../validators/unidade-orcamentaria-form.schema';

interface UnidadeOrcamentariaFormProps {
  form: UseFormReturn<UnidadeOrcamentariaFormData>;
  submitting: boolean;
  disabled?: boolean;
  onSubmit: (values: UnidadeOrcamentariaFormData) => void | Promise<void>;
}

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 bg-white px-4 text-sm text-gray-700';

function formatCodigo(value: string) {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 6);

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4, 6)}`;
}

export function UnidadeOrcamentariaForm({
  form,
  submitting,
  disabled = false,
  onSubmit,
}: Readonly<UnidadeOrcamentariaFormProps>) {
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
          <FormField
            control={form.control}
            name='codigo'
            render={({ field }) => (
              <FormItem>
                <div className='flex h-6 items-center'>
                  <FormLabel className='text-sm font-semibold text-gray-700' htmlFor='codigo-inicial'>
                    Código Inicial
                  </FormLabel>
                </div>
                <FormControl>
                  <Input
                    id='codigo-inicial'
                    inputMode='numeric'
                    placeholder='00.00.00'
                    className={INPUT_CLASS}
                    disabled={disabled || submitting}
                    value={field.value}
                    onChange={(event) => field.onChange(formatCodigo(event.target.value))}
                  />
                </FormControl>
                <FormDescription>Use o padrão 00.00.00.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <StatusSelectField
            control={form.control}
            name='status'
            disabled={disabled || submitting}
            containerClassName='min-w-0'
            triggerClassName={`${INPUT_CLASS} w-full data-[size=default]:h-11`}
          />
        </div>

        <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
          <UppercaseTextField
            control={form.control}
            name='sigla'
            label='Sigla'
            id='sigla'
            placeholder='Digite a sigla da unidade orçamentária'
            inputClassName={INPUT_CLASS}
            disabled={disabled || submitting}
          />

          <UppercaseTextField
            control={form.control}
            name='nome'
            label='Nome'
            id='nome'
            placeholder='Digite o nome da unidade orçamentária'
            inputClassName={INPUT_CLASS}
            disabled={disabled || submitting}
          />
        </div>
      </form>
    </Form>
  );
}