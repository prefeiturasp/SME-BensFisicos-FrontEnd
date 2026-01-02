import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
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

const TOAST_DURATION = 1500;
const LOGIN_ROUTE = '/';

const PASSWORD_INPUT_CLASSES =
  'h-11 border-gray-300 rounded-xs font-normal text-sm p-5 text-[#42474A]';

const PASSWORD_REQUIREMENTS = [
  'Sua senha não deve conter informações pessoais.',
  'Sua senha deve ter ao menos 6 caracteres.',
  'Sua senha deve conter letras, números e caracteres especiais.',
] as const;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'A senha deve ter no mínimo 6 caracteres')
      .regex(/[a-zA-Z]/, 'A senha deve conter letras')
      .regex(/[0-9]/, 'A senha deve conter números')
      .regex(/[^A-Za-z0-9]/, 'A senha deve conter caracteres especiais'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!uidb64 || !token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await passwordService.confirmReset({
        uidb64,
        token,
        new_password: data.password,
        new_password_confirm: data.confirmPassword,
      });

      toast.success('Senha redefinida com sucesso!', {
        description: 'Você será redirecionado para a tela de login.',
      });

      setTimeout(() => {
        navigate(LOGIN_ROUTE, { state: { passwordReset: true } });
      }, TOAST_DURATION);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao redefinir senha. O link pode ter expirado.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title={<h1 className='text-xl text-[#363636] font-bold'>Recuperar senha</h1>}>
      <div className='mb-10'>
        <p className='text-sm font-semibold text-black mb-2'>Crie uma nova senha:</p>
        <ul className='text-xs text-black space-y-1 list-disc list-inside ml-2'>
          {PASSWORD_REQUIREMENTS.map((requirement, index) => (
            <li key={index}>{requirement}</li>
          ))}
        </ul>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700'>Nova senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    className={PASSWORD_INPUT_CLASSES}
                    autoComplete='new-password'
                    autoFocus
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
              <FormItem className='mt-8'>
                <FormLabel className='text-gray-700'>Confirme a nova senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    className={PASSWORD_INPUT_CLASSES}
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
      </Form>
    </AuthLayout>
  );
}
