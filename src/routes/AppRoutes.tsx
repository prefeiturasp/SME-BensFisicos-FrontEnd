import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/modules/auth/pages/LoginPage';
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import ChangePasswordPage from '@/modules/auth/pages/ChangePasswordPage';
import HomePage from '../pages/HomePage';
import { ProtectedRoute } from '../auth/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rotas de Autenticação */}
      <Route path='/' element={<LoginPage />} />
      <Route path='/esqueceu-senha' element={<ForgotPasswordPage />} />
      <Route path='/verifique-email' element={<VerifyEmailPage />} />
      <Route path='/recuperar-senha/:uidb64/:token' element={<ResetPasswordPage />} />

      {/* Rotas Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path='/home' element={<HomePage />} />
        <Route path='/trocar-senha' element={<ChangePasswordPage />} />
      </Route>

      {/* Rota de fallback */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
