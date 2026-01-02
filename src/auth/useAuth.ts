import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginCredentials } from './auth.service';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!authService.isAuthenticated()) {
        return null;
      }
      const { data } = await authService.getCurrentUser();
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      queryClient.setQueryData(['user'], data.user);
      await queryClient.refetchQueries({ queryKey: ['user'] });
      navigate('/home');
    },
  });

  const logout = () => {
    authService.logout();
    queryClient.clear();
    navigate('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: (credentials: LoginCredentials) => loginMutation.mutate(credentials),
    loginAsync: (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
