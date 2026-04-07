import { CircleHelp } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { UnidadeAdministrativaFormData } from '../validators/unidade-administrativa-form.schema';

interface UnidadeAdministrativaFormProps {
  form: UseFormReturn<UnidadeAdministrativaFormData>;
  uoCodigo: string;
  uoNome: string;
  submitting: boolean;
  disabled?: boolean;
  onSubmit: (values: UnidadeAdministrativaFormData) => void | Promise<void>;
}

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 bg-white px-4 text-sm text-gray-700';

const READONLY_INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 bg-[#F5F5F5] px-4 text-sm text-gray-700 disabled:opacity-100';

export function UnidadeAdministrativaForm({
  form,
  uoCodigo,
  uoNome,
  submitting,
  disabled = false,
  onSubmit,
}: Readonly<UnidadeAdministrativaFormProps>) {
  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {rootError && (
          <div className='rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {rootError}
          </div>
        )}

        <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,280px)_minmax(0,1fr)]'>
          <FormItem className='min-w-0'>
            <div className='flex h-6 items-center'>
              <FormLabel className='text-sm font-semibold text-gray-700'>
                Unidade Orçamentária
              </FormLabel>
            </div>
            <FormControl>
              <Input
                value={uoNome ? `${uoCodigo} - ${uoNome}` : 'Unidade orçamentária não disponível'}
                disabled
                className={READONLY_INPUT_CLASS}
              />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name='codigoFinal'
            render={({ field }) => (
              <FormItem className='min-w-0'>
                <div className='flex h-6 items-center gap-2'>
                  <FormLabel className='text-sm font-semibold text-gray-700' htmlFor='codigo-final-sufixo'>
                    Código (final)
                  </FormLabel>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        className='inline-flex text-gray-500 transition-colors hover:text-gray-700'
                        aria-label='Ajuda sobre o código final'
                      >
                        <CircleHelp size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='top' sideOffset={8}>
                      Informe apenas os 3 últimos dígitos. O prefixo da Unidade Orçamentária será aplicado automaticamente.
                    </TooltipContent>
                  </Tooltip>
                </div>

                <FormControl>
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_88px]'>
                    <Input
                      value={`${uoCodigo}.`}
                      disabled
                      className={READONLY_INPUT_CLASS}
                    />
                    <Input
                      id='codigo-final-sufixo'
                      inputMode='numeric'
                      maxLength={3}
                      placeholder='286'
                      aria-describedby='codigo-final-helper'
                      className={INPUT_CLASS}
                      disabled={disabled || submitting}
                      value={field.value}
                      onChange={(event) => {
                        const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 3);
                        field.onChange(digitsOnly);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='status'
            render={({ field }) => {
              const statusKey = field.value || 'status-empty';

              return (
                <FormItem className='min-w-0 md:col-span-2 xl:col-span-1'>
                  <div className='flex h-6 items-center'>
                    <FormLabel className='text-sm font-semibold text-gray-700'>Status</FormLabel>
                  </div>
                  <Select
                    key={statusKey}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || submitting}
                  >
                    <FormControl>
                      <SelectTrigger className={`${INPUT_CLASS} w-full data-[size=default]:h-11`}>
                        <SelectValue placeholder='Selecione o status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
                      <SelectItem value='ativa'>Ativa</SelectItem>
                      <SelectItem value='inativa'>Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='sigla'
            render={({ field }) => (
              <FormItem>
                <div className='flex h-6 items-center'>
                  <FormLabel className='text-sm font-semibold text-gray-700'>Sigla</FormLabel>
                </div>
                <FormControl>
                  <Input
                    placeholder='Digite a sigla da unidade administrativa'
                    className={INPUT_CLASS}
                    disabled={disabled || submitting}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='nome'
            render={({ field }) => (
              <FormItem>
                <div className='flex h-6 items-center'>
                  <FormLabel className='text-sm font-semibold text-gray-700'>Nome</FormLabel>
                </div>
                <FormControl>
                  <Input
                    placeholder='Digite o nome da unidade administrativa'
                    className={INPUT_CLASS}
                    disabled={disabled || submitting}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
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
