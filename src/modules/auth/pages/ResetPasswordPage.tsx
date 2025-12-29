import { AuthLayout } from '../components/AuthLayout';

export default function VerifyEmailPage() {
  return (
    <AuthLayout title={<h1 className='text-lg text-[#363636] font-bold'>Verifique seu e-mail</h1>}>
      <div>
        Recuperar senha
      </div>
    </AuthLayout>
  );
}
