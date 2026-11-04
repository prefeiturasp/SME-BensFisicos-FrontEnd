import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import {
  AuthLayout,
  NewPasswordFields,
  PasswordFormActions,
  PasswordRequirements,
} from '../components/AuthLayout';
import { passwordService } from '../services/password.service';
import { firstAccessPasswordSchema } from '../validators/password';

const TOAST_DURATION = 1500;
const LOGIN_ROUTE = '/';

const resetPasswordSchema = firstAccessPasswordSchema;

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
      <PasswordRequirements title='Crie uma nova senha:' className='mb-10' />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
          <NewPasswordFields
            control={form.control}
            confirmItemClassName='mt-8'
            showPlaceholders={false}
            autoFocus
          />
          <PasswordFormActions error={error} isSubmitting={isSubmitting} />
        </form>
      </Form>
    </AuthLayout>
  );
}
