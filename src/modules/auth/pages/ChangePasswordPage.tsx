import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import PasswordInput from '@/components/ui/password-input';
import {
  AuthLayout,
  NewPasswordFields,
  PasswordFormActions,
  PasswordRequirements,
  AUTH_INPUT_STYLES,
} from '../components/AuthLayout';
import { passwordService } from '../services/password.service';
import { changePasswordSchema } from '../validators/password';

const TOAST_DURATION = 1500;
const HOME_ROUTE = '/home';

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
      <PasswordRequirements title='Atualize sua senha:' />
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
                    className={AUTH_INPUT_STYLES}
                    placeholder='Senha atual'
                    autoComplete='current-password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <NewPasswordFields control={form.control} />
          <PasswordFormActions error={error} isSubmitting={isSubmitting} />
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
