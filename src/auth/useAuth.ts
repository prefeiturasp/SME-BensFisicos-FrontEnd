import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginCredentials } from './auth.service';
import { setAuthToken, getAuthToken } from '@/api/http';
import { clearEscopoStorage, setEscopoStorage } from '@/lib/escopo-storage';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!getAuthToken()) {
        try {
          const { access } = await authService.refreshToken();
          setAuthToken(access);
        } catch {
          return null;
        }
      }
      try {
        const { data } = await authService.getCurrentUser();
        return data;
      } catch {
        return null;
      }
    },

    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!user) {
      clearEscopoStorage();
      return;
    }

    setEscopoStorage({
      uoId: user.uo_ativa?.id ?? null,
      uaId: user.ua_ativa?.id ?? null,
    });
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      setAuthToken(data.access);
      queryClient.setQueryData(['user'], data.user);
      await queryClient.refetchQueries({ queryKey: ['user'] });
      if (data.user.must_change_password) {
        navigate('/primeiro-acesso');
        return;
      }
      navigate('/home');
    },
  });

  const logout = async () => {
    await authService.logout();
    setAuthToken(null);
    clearEscopoStorage();
    queryClient.clear();
    navigate('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    mustChangePassword: !!user?.must_change_password,
    login: (credentials: LoginCredentials) => loginMutation.mutate(credentials),
    loginAsync: (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
