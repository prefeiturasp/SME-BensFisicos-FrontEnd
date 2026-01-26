import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
const HOME_ROUTE = '/home';

type FirstAccessPasswordFormData = z.infer<typeof firstAccessPasswordSchema>;

export default function FirstAccessChangePasswordPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FirstAccessPasswordFormData>({
    resolver: zodResolver(firstAccessPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FirstAccessPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await passwordService.firstAccessChangePassword({
        new_password: data.password,
        new_password_confirm: data.confirmPassword,
      });

      await queryClient.refetchQueries({ queryKey: ['user'] });

      toast.success('Senha alterada com sucesso!', {
        description: 'Você pode continuar usando o sistema.',
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
      console.error('Erro ao trocar senha (primeiro acesso):', err);
    }
  };

  return (
    <AuthLayout title={<h1 className='text-xl text-[#363636] font-bold'>Primeiro acesso</h1>}>
      <PasswordRequirements title='Para continuar, cadastre uma nova senha:' />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
          <NewPasswordFields control={form.control} />
          <PasswordFormActions error={error} isSubmitting={isSubmitting} />
        </form>
      </Form>
    </AuthLayout>
  );
}
