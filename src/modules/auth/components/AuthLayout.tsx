import type { Control, FieldValues, Path } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import PasswordInput from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PASSWORD_REQUIREMENTS } from '../validators/password';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function AuthLayout({ children, title, subtitle }: Readonly<AuthLayoutProps>) {
  return (
    <div className='min-h-screen flex'>
      {/* Lado esquerdo - Imagem */}
      <div className='hidden lg:flex lg:w-2/3 relative'>
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{ backgroundImage: "url('/login_background.png')" }}
        />
      </div>

      {/* Lado direito - Formulário */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-white mt-8'>
        <div className='w-full max-w-md'>
          {/* Logo Bens Físicos */}
          <div className='flex items-center gap-3 mb-12'>
            <img
              src='/bens_logo_padrao.png'
              alt='Logo Bens Físicos'
              className='h-20 w-auto object-contain'
            />
            <div className='w-57.5'>
              <div>{title}</div>
              {subtitle && <div>{subtitle}</div>}
            </div>
          </div>

          {/* Conteúdo */}
          {children}

          {/* Logo Prefeitura no rodapé */}
          <div className='mt-20 flex justify-center'>
            <img
              src='/prefeitura_logo_padrao.png'
              alt='Prefeitura de São Paulo'
              className='h-17.25 w-auto object-contain'
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const AUTH_INPUT_STYLES =
  'h-11 border-gray-300 rounded-xs font-normal text-sm p-5 text-gray-700';

type PasswordRequirementsProps = {
  title: string;
  className?: string;
};

export function PasswordRequirements({ title, className }: PasswordRequirementsProps) {
  return (
    <div className={cn('mb-6', className)}>
      <p className='text-sm font-semibold text-black mb-2'>{title}</p>
      <ul className='text-xs text-black space-y-1 list-disc list-inside ml-2'>
        {PASSWORD_REQUIREMENTS.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
    </div>
  );
}

type NewPasswordFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  inputClassName?: string;
  showPlaceholders?: boolean;
  confirmItemClassName?: string;
  autoFocus?: boolean;
};

export function NewPasswordFields<T extends FieldValues>({
  control,
  inputClassName = AUTH_INPUT_STYLES,
  showPlaceholders = true,
  confirmItemClassName,
  autoFocus = false,
}: NewPasswordFieldsProps<T>) {
  return (
    <>
      <FormField
        control={control}
        name={'password' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-gray-700'>Nova senha</FormLabel>
            <FormControl>
              <PasswordInput
                className={inputClassName}
                placeholder={showPlaceholders ? 'Nova senha' : undefined}
                autoComplete='new-password'
                autoFocus={autoFocus}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={'confirmPassword' as Path<T>}
        render={({ field }) => (
          <FormItem className={confirmItemClassName}>
            <FormLabel className='text-gray-700'>Confirme a nova senha</FormLabel>
            <FormControl>
              <PasswordInput
                className={inputClassName}
                placeholder={showPlaceholders ? 'Confirme a nova senha' : undefined}
                autoComplete='new-password'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

type PasswordFormActionsProps = {
  error: string | null;
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
};

export function PasswordFormActions({
  error,
  isSubmitting,
  submitLabel = 'Salvar',
  submittingLabel = 'Salvando...',
}: PasswordFormActionsProps) {
  return (
    <>
      {error && (
        <div
          className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3'
          role='alert'
        >
          {error}
        </div>
      )}

      <Button
        type='submit'
        className='w-full h-12 mt-5 bg-[#00703C] hover:bg-[#005a30] text-white font-bold text-md rounded-sm'
        disabled={isSubmitting}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </>
  );
}
