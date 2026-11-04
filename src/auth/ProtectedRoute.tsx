import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

const FIRST_ACCESS_ROUTE = '/primeiro-acesso';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  if (mustChangePassword && location.pathname !== FIRST_ACCESS_ROUTE) {
    return <Navigate to={FIRST_ACCESS_ROUTE} replace />;
  }

  return <Outlet />;
}
