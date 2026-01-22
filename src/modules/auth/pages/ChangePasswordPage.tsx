import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import PasswordInput from '@/components/ui/password-input';
import { AuthLayout } from '../components/AuthLayout';
import { passwordService } from '../services/password.service';
import { PASSWORD_REQUIREMENTS, changePasswordSchema } from '../validators/password';

const TOAST_DURATION = 1500;
const HOME_ROUTE = '/home';

const INPUT_STYLES = 'h-11 border-gray-300 rounded-xs font-normal text-sm p-5 text-gray-700';

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await passwordService.changePassword({
        old_password: data.oldPassword,
        new_password: data.password,
        new_password_confirm: data.confirmPassword,
      });

      toast.success('Senha alterada com sucesso!', {
        description: 'Você será redirecionado para a home.',
      });

      form.reset();

      setTimeout(() => {
        navigate(HOME_ROUTE);
      }, TOAST_DURATION);
    } catch (err) {
      setIsSubmitting(false);
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao trocar senha. Tente novamente.';
      setError(errorMessage);
      console.error('Erro ao trocar senha:', err);

      if (
        errorMessage.toLowerCase().includes('atual') ||
        errorMessage.toLowerCase().includes('incorreta')
      ) {
        form.setFocus('oldPassword');
      }
    }
  };

  return (
    <AuthLayout title={<h1 className='text-xl text-[#363636] font-bold'>Trocar senha</h1>}>
      <div className='mb-6'>
        <p className='text-sm font-semibold text-black mb-2'>Atualize sua senha:</p>
        <ul className='text-xs text-black space-y-1 list-disc list-inside ml-2'>
          {PASSWORD_REQUIREMENTS.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
          <FormField
            control={form.control}
            name='oldPassword'
            render={({ field }) => (
              <FormItem className='mt-8'>
                <FormLabel className='text-gray-700'>Senha atual</FormLabel>
                <FormControl>
                  <PasswordInput
                    className={INPUT_STYLES}
                    placeholder='Senha atual'
                    autoComplete='current-password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700'>Nova senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    className={INPUT_STYLES}
                    placeholder='Nova senha'
                    autoComplete='new-password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700'>Confirme a nova senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    className={INPUT_STYLES}
                    placeholder='Confirme a nova senha'
                    autoComplete='new-password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>

        <div className='mt-6 text-center'>
          <button
            type='button'
            onClick={() => navigate(HOME_ROUTE)}
            className='text-sm text-gray-600 hover:text-[#00703C] underline hover:no-underline transition-colors'
          >
            Voltar para a página inicial
          </button>
        </div>
      </Form>
    </AuthLayout>
  );
}
