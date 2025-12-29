import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, CheckCircle, User, Mail, Building2, Shield } from 'lucide-react';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className='min-h-screen flex items-center justify-center bg-muted/40 p-4'>
      <Card className='w-full max-w-2xl'>
        <CardHeader>
          <CardTitle className='text-2xl flex items-center gap-2'>
            <CheckCircle className='h-6 w-6 text-green-600' />
            Bem-vindo ao Sistema de Gestão de Bens Patrimoniais
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Informações do Usuário */}
          <div className='grid gap-4'>
            <div className='p-4 bg-muted rounded-lg space-y-3'>
              <p className='text-sm font-semibold text-muted-foreground mb-3'>Dados do Usuário</p>

              <div className='flex items-center gap-3'>
                <User className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-xs text-muted-foreground'>Nome</p>
                  <p className='font-medium'>{user?.nome || 'Não informado'}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-xs text-muted-foreground'>E-mail</p>
                  <p className='font-medium'>{user?.email || 'Não informado'}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <User className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-xs text-muted-foreground'>Usuário</p>
                  <p className='font-medium'>{user?.username}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <User className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-xs text-muted-foreground'>RF</p>
                  <p className='font-medium'>{user?.rf || 'Não informado'}</p>
                </div>
              </div>

              {user?.unidade_administrativa && (
                <div className='flex items-center gap-3'>
                  <Building2 className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-xs text-muted-foreground'>Unidade Administrativa</p>
                    <p className='font-medium'>{user.unidade_administrativa.nome}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Permissões */}
            <div className='p-4 bg-muted rounded-lg space-y-3'>
              <p className='text-sm font-semibold text-muted-foreground mb-3'>Permissões</p>

              <div className='flex items-center gap-3'>
                <Shield className='h-4 w-4 text-muted-foreground' />
                <div className='flex gap-3'>
                  {user?.is_gestor_patrimonio && (
                    <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                      Gestor de Patrimônio
                    </span>
                  )}
                  {user?.is_operador_inventario && (
                    <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                      Operador de Inventário
                    </span>
                  )}
                  {!user?.is_gestor_patrimonio && !user?.is_operador_inventario && (
                    <span className='text-xs text-muted-foreground'>Sem permissões especiais</span>
                  )}
                </div>
              </div>

              {user?.must_change_password && (
                <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                  <p className='text-sm text-yellow-800'>
                    ⚠️ Você precisa alterar sua senha no próximo acesso.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button variant='outline' className='w-full' onClick={logout}>
            <LogOut className='h-4 w-4' />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
