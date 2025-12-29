import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@/auth/useAuth';
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
import PasswordInput from '@/components/ui/password-input';
import { AuthLayout } from '../components/AuthLayout';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const location = useLocation();
  const passwordReset = location.state?.passwordReset;
  const { login, isLoggingIn, loginError } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <AuthLayout
      title={<h1 className='text-lg text-[#363636]'>Bem-vindo(a) ao</h1>}
      subtitle={
        <div className='text-2xl font-semibold text-black mt-1'>
          Sistema de Gestão de Bens Patrimoniais
        </div>
      }
    >
      {passwordReset && (
        <div className='mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3'>
          Senha alterada com sucesso! Faça login com sua nova senha.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700 text-md font-normal'>Usuário</FormLabel>
                <FormControl>
                  <Input
                    className='h-11 border-gray-300 rounded-xs font-normal text-sm p-5 text-[#42474A]'
                    placeholder=''
                    autoComplete='username'
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
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700 text-md font-normal'>Senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    type='password'
                    className='h-11 border-gray-300 rounded-xs font-normal text-sm p-5 text-[#42474A]'
                    placeholder=''
                    autoComplete='current-password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {loginError && (
            <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3'>
              Erro ao fazer login. Verifique suas credenciais.
            </div>
          )}

          <Button
            type='submit'
            className='w-full h-12 mt-5 bg-[#00703C] hover:bg-[#005a30] text-white font-bold text-md rounded-sm'
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Entrando...' : 'Acessar'}
          </Button>

          <div className='text-center pt-2 mt-4'>
            <Link
              to='/esqueceu-senha'
              className='text-sm text-[#00703C] hover:underline font-medium'
            >
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
