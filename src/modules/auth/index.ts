// Páginas de autenticação
export { default as LoginPage } from './pages/LoginPage';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage';
export { default as VerifyEmailPage } from './pages/VerifyEmailPage';
export { default as ResetPasswordPage } from './pages/ResetPasswordPage';

// Componentes
export { AuthLayout } from './components/AuthLayout';

// Serviços
export { passwordService } from './services/password.service';
export type {
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordChange,
} from './services/password.service';
