import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

export default function VerifyEmailPage() {
  return (
    <AuthLayout title={<h1 className='text-lg text-[#363636] font-bold'>Verifique seu e-mail</h1>}>
      <div className='text-center space-y-6'>
        <div className='flex justify-center -mt-6'>
          <div className='flex items-center justify-center'>
            <Mail className='w-16 h-16 text-[#0F7B4B]' strokeWidth={2} />
          </div>
        </div>

        <div className='space-y-3'>
          <h2 className='text-xl font-bold text-[#0F7B4B] -mt-5'>E-mail enviado com sucesso!</h2>
          <p className='text-md text-black leading-relaxed mt-8'>
            Se o e-mail informado estiver cadastrado no sistema,
            <br />
            você receberá um link para redefinir sua senha.
          </p>
        </div>

        <div className='pl-20 pr-20 text-left space-y-2'>
          <p className='text-sm text-[#606060] leading-relaxed'>
            Verifique sua caixa de entrada e também a pasta de spam. O link expira em 24 horas.
          </p>
        </div>

        <Button
          asChild
          className='w-full h-12 mt-5 bg-[#00703C] hover:bg-[#005a30] text-white font-bold text-md rounded-sm'
        >
          <Link to='/'>Voltar ao Login</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
