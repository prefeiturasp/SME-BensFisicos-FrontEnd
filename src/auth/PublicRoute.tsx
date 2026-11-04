import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

const FIRST_ACCESS_ROUTE = '/primeiro-acesso';

export function PublicRoute() {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();

  if (isLoading) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (mustChangePassword) {
      return <Navigate to={FIRST_ACCESS_ROUTE} replace />;
    }
    return <Navigate to='/home' replace />;
  }

  return <Outlet />;
}
