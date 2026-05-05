import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

interface UnidadesOrcamentariasGuardProps {
  children: ReactNode;
}

export function UnidadesOrcamentariasGuard({
  children,
}: Readonly<UnidadesOrcamentariasGuardProps>) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <span className='text-sm text-gray-500'>Carregando permissões do módulo...</span>
      </div>
    );
  }

  if (!user?.is_superuser) {
    return <Navigate to='/home' replace />;
  }

  return <>{children}</>;
}