import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to='/home' replace />;
  }

  return <Outlet />;
}
