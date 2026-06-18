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

function formatCodigoUO(value: string) {
  const digitsOnly = value.replaceAll(/\D/g, '').slice(0, 6);

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
}

function formatCodigoOrgao(value: string) {
  const digitsOnly = value.replaceAll(/\D/g, '').slice(0, 4);

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
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
                  <FormLabel className='text-sm font-semibold text-gray-700' htmlFor='codigo'>
                    Código da UO
                  </FormLabel>
                </div>
                <FormControl>
                  <Input
                    id='codigo'
                    inputMode='numeric'
                    placeholder='Informe o código da UO'
                    className={INPUT_CLASS}
                    disabled={disabled || submitting}
                    value={field.value}
                    onChange={(event) => field.onChange(formatCodigoUO(event.target.value))}
                  />
                </FormControl>
                <FormDescription>Obrigatório. Exemplo: 01.16.10.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <UppercaseTextField
            control={form.control}
            name='sigla'
            label='Sigla da UO'
            id='sigla'
            placeholder='Informe a sigla da UO'
            inputClassName={INPUT_CLASS}
            disabled={disabled || submitting}
          />
        </div>

        <div className='grid grid-cols-1 items-start gap-6'>
          <UppercaseTextField
            control={form.control}
            name='nome'
            label='Nome da UO'
            id='nome'
            placeholder='Informe o nome da UO'
            inputClassName={INPUT_CLASS}
            disabled={disabled || submitting}
          />
        </div>

        <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='codigo_orgao'
            render={({ field }) => (
              <FormItem>
                <div className='flex h-6 items-center'>
                  <FormLabel className='text-sm font-semibold text-gray-700' htmlFor='codigo-orgao'>
                    Código do órgão
                  </FormLabel>
                </div>
                <FormControl>
                  <Input
                    id='codigo-orgao'
                    inputMode='numeric'
                    placeholder='Informe o código do órgão'
                    className={INPUT_CLASS}
                    disabled={disabled || submitting}
                    value={field.value}
                    onChange={(event) => field.onChange(formatCodigoOrgao(event.target.value))}
                  />
                </FormControl>
                <FormDescription>Opcional. Exemplo: 00.00.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <UppercaseTextField
            control={form.control}
            name='sigla_orgao'
            label='Sigla do órgão'
            id='sigla-orgao'
            placeholder='Informe a sigla do órgão'
            inputClassName={INPUT_CLASS}
            disabled={disabled || submitting}
          />
        </div>

        <div className='grid grid-cols-1 items-start gap-6'>
          <UppercaseTextField
            control={form.control}
            name='orgao'
            label='Nome do órgão'
            id='orgao'
            placeholder='Informe o nome do órgão'
            inputClassName={INPUT_CLASS}
            disabled={disabled || submitting}
          />
        </div>

        <div className='grid grid-cols-1 items-start gap-6 md:max-w-sm'>
          <StatusSelectField
            control={form.control}
            name='status'
            disabled={disabled || submitting}
            containerClassName='min-w-0'
            triggerClassName={`${INPUT_CLASS} w-full data-[size=default]:h-11`}
          />
        </div>
      </form>
    </Form>
  );
}