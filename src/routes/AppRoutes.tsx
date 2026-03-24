import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/modules/auth/pages/LoginPage';
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import ChangePasswordPage from '@/modules/auth/pages/ChangePasswordPage';
import FirstAccessChangePasswordPage from '@/modules/auth/pages/FirstAccessChangePasswordPage';

// Pages Globais
import HomePage from '../pages/HomePage';

// Módulo: Bem Patrimonial
import BensListPage from '@/modules/bem-patrimonial/bem/pages/BensListPage';
import BemCreatePage from '@/modules/bem-patrimonial/bem/pages/BemCreatePage';
import BemEditPage from '@/modules/bem-patrimonial/bem/pages/BemEditPage';
import BemDetailPage from '@/modules/bem-patrimonial/bem/pages/BemDetailPage';
import MovimentacoesListPage from '@/modules/bem-patrimonial/movimentacao/pages/MovimentacoesListPage';
import BaixasListPage from '@/modules/bem-patrimonial/baixa-fisica/pages/BaixasListPage';

// Módulo: Inventário
import InventarioListPage from '@/modules/inventario/pages/InventarioListPage';

import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PublicRoute } from '../auth/PublicRoute';

import MainLayout from '@/components/layout/MainLayout';
import UsuariosListPage from '@/modules/configuracoes/usuarios/pages/UsuariosListPage';
import AdicionarUsuarioPage from '@/modules/configuracoes/usuarios/pages/AdicionarUsuarioPage';
import UnidadesAdministrativasListPage from '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasListPage';
import UnidadesAdministrativasCreatePage from '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasCreatePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas (acessíveis apenas se NÃO logado) */}
      <Route element={<PublicRoute />}>
        <Route path='/' element={<LoginPage />} />
        <Route path='/esqueceu-senha' element={<ForgotPasswordPage />} />
        <Route path='/verifique-email' element={<VerifyEmailPage />} />
        <Route path='/recuperar-senha/:uidb64/:token' element={<ResetPasswordPage />} />
      </Route>

      {/* Rotas Protegidas (acessíveis apenas se logado) */}
      <Route element={<ProtectedRoute />}>
        <Route path='/primeiro-acesso' element={<FirstAccessChangePasswordPage />} />
        <Route path='/trocar-senha' element={<ChangePasswordPage />} />

        <Route element={<MainLayout />}>
          <Route path='/home' element={<HomePage />} />

          {/* Módulo: Bem Patrimonial */}
          <Route path='/bens-patrimoniais' element={<BensListPage />} />
          <Route path='/bens-patrimoniais/novo' element={<BemCreatePage />} />
          <Route path='/bens-patrimoniais/:id' element={<BemDetailPage />} />
          <Route path='/bens-patrimoniais/:id/editar' element={<BemEditPage />} />

          <Route path='/movimentacoes' element={<MovimentacoesListPage />} />
          <Route path='/baixas-fisicas' element={<BaixasListPage />} />

          {/* Módulo: Inventário */}
          <Route path='/inventarios' element={<InventarioListPage />} />

          {/* Módulo: Configurações */}
          <Route path='/unidades-administrativas' element={<UnidadesAdministrativasListPage />} />
          <Route path='/unidades-administrativas/novo' element={<UnidadesAdministrativasCreatePage />} />
          <Route path='/usuarios' element={<UsuariosListPage />} />
          <Route path='/usuarios/novo' element={<AdicionarUsuarioPage />} />
        </Route>
      </Route>

      {/* Rota de fallback */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
