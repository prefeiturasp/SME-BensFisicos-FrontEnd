import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/modules/auth/pages/LoginPage';
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import ChangePasswordPage from '@/modules/auth/pages/ChangePasswordPage';

// Pages Globais
import HomePage from '../pages/HomePage';

// Módulo: Bem Patrimonial
import BensListPage from '@/modules/bem-patrimonial/bem/pages/BensListPage';
import BemCreatePage from '@/modules/bem-patrimonial/bem/pages/BemCreatePage';
import MovimentacoesListPage from '@/modules/bem-patrimonial/movimentacao/pages/MovimentacoesListPage';
import BaixasListPage from '@/modules/bem-patrimonial/baixa-fisica/pages/BaixasListPage';

// Módulo: Inventário
import InventarioListPage from '@/modules/inventario/pages/InventarioListPage';

import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PublicRoute } from '../auth/PublicRoute';

import MainLayout from '@/components/layout/MainLayout';

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
        <Route path='/trocar-senha' element={<ChangePasswordPage />} />

        <Route element={<MainLayout />}>
          <Route path='/home' element={<HomePage />} />

          {/* Módulo: Bem Patrimonial */}
          <Route path='/bens-patrimoniais' element={<BensListPage />} />
          <Route path='/bens-patrimoniais/novo' element={<BemCreatePage />} />
          <Route path='/bens-patrimoniais/:id' element={<div>Visualizar Bem (Implementar)</div>} />
          <Route
            path='/bens-patrimoniais/:id/editar'
            element={<div>Editar Bem (Implementar)</div>}
          />

          <Route path='/movimentacoes' element={<MovimentacoesListPage />} />
          <Route path='/baixas-fisicas' element={<BaixasListPage />} />

          {/* Módulo: Inventário */}
          <Route path='/inventarios' element={<InventarioListPage />} />
        </Route>
      </Route>

      {/* Rota de fallback */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
