import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '../components/AuthLayout';
import { passwordService } from '../services/password.service';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await passwordService.requestReset(data);
      navigate('/verifique-email', { state: { email: data.email } });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao solicitar recuperação de senha.';
      setError(errorMessage);
      console.error('Erro ao solicitar reset de senha:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={<h1 className='text-lg text-[#363636] font-semibold'>Esqueceu sua senha?</h1>}
      subtitle={
        <div className='text-md text-black mt-1'>Informe seu e-mail para recuperar o acesso</div>
      }
    >
      <div className='mb-6 mt-16'>
        <p className='text-sm text-black font-normal'>
          Digite o e-mail cadastrado no sistema. Você receberá um link seguro para redefinir sua
          senha.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700 text-md font-normal'>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    className='h-11 border-gray-300 rounded-xs font-normal text-sm p-5 text-[#42474A]'
                    placeholder=''
                    autoComplete='email'
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3'>
              {error}
            </div>
          )}

          <Button
            type='submit'
            className='w-full h-12 mt-6 bg-[#00703C] hover:bg-[#005a30] text-white font-bold text-md rounded-sm'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>

          <div className='text-center pt-2 mt-4'>
            <Link to='/' className='text-sm text-[#00703C] hover:underline font-medium'>
              Voltar ao Login
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
