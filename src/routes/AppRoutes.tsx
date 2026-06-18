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
import AdicionarMovimentacaoPage from '@/modules/bem-patrimonial/movimentacao/pages/AdicionarMovimentacaoPage';
import MovimentacaoDetailPage from '@/modules/bem-patrimonial/movimentacao/pages/MovimentacaoDetailPage';
import BaixasListPage from '@/modules/bem-patrimonial/baixa-fisica/pages/BaixasListPage';

// Módulo: Inventário
import InventarioListPage from '@/modules/inventario/pages/InventarioListPage';
import ParametrosConciliacaoAnualListPage from '@/modules/inventario/parametros-conciliacao-anual/pages/ParametrosConciliacaoAnualListPage';
import ParametroConciliacaoAnualFormPage from '@/modules/inventario/parametros-conciliacao-anual/pages/ParametroConciliacaoAnualFormPage';

import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PublicRoute } from '../auth/PublicRoute';

import MainLayout from '@/components/layout/MainLayout';
import UsuariosListPage from '@/modules/configuracoes/usuarios/pages/UsuariosListPage';
import AdicionarUsuarioPage from '@/modules/configuracoes/usuarios/pages/AdicionarUsuarioPage';
import UnidadesAdministrativasListPage from '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasListPage';
import ViewUsuarioPage from '@/modules/configuracoes/usuarios/pages/ViewUsuarioPage';
import EditarUsuarioPage from '@/modules/configuracoes/usuarios/pages/EditUsuarioPage';
import UnidadesAdministrativasCreatePage from '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasCreatePage';
import UnidadesAdministrativasViewPage from '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasViewPage';
import AdicionarBaixaPage from '@/modules/bem-patrimonial/baixa-fisica/pages/AdicionarBaixaPage';
import VerBaixaPage from '@/modules/bem-patrimonial/baixa-fisica/pages/VerBaixaPage';
import UnidadesOrcamentariasListPage from '@/modules/configuracoes/unidades-orcamentarias/pages/UnidadesOrcamentariasListPage';
import UnidadesOrcamentariasCreatePage from '@/modules/configuracoes/unidades-orcamentarias/pages/UnidadesOrcamentariasCreatePage';
import UnidadesOrcamentariasViewPage from '@/modules/configuracoes/unidades-orcamentarias/pages/UnidadesOrcamentariasViewPage';
import BemImportPage from '@/modules/bem-patrimonial/bem/pages/BemImportPage';
import SolicitarCorrecaoPage from '@/modules/bem-patrimonial/baixa-fisica/pages/SolicitarCorrecaoPage';

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
          <Route path='/bens-patrimoniais/importar' element={<BemImportPage />} />

          {/* Submódulo: Movimentações */}
          <Route path='/movimentacoes' element={<MovimentacoesListPage />} />
          <Route path='/movimentacoes/:id' element={<MovimentacaoDetailPage />} />
          <Route path='/movimentacoes/novo' element={<AdicionarMovimentacaoPage />} />
          
          {/* Submódulo: Baixas Físicas */}
          <Route path='/baixas-fisicas' element={<BaixasListPage />} />
          <Route path='/baixas-fisicas/novo' element={<AdicionarBaixaPage />} />
          <Route path='/baixas-fisicas/:id' element={<VerBaixaPage />} />
          <Route path='/baixas-fisicas/:id/solicitar-correcao' element={<SolicitarCorrecaoPage />} />

          {/* Módulo: Inventário */}
          <Route path='/inventarios' element={<InventarioListPage />} />
          <Route path='/parametros-conciliacao-anual' element={<ParametrosConciliacaoAnualListPage />} />
          <Route path='/parametros-conciliacao-anual/novo' element={<ParametroConciliacaoAnualFormPage />} />
          <Route path='/parametros-conciliacao-anual/:id' element={<ParametroConciliacaoAnualFormPage />} />
          <Route path='/parametros-conciliacao-anual/:id/editar' element={<ParametroConciliacaoAnualFormPage />} />

          {/* Módulo: Configurações */}
          {/* Submódulo: Unidades Administrativas */}
          <Route path='/unidades-administrativas' element={<UnidadesAdministrativasListPage />} />
          <Route path='/unidades-administrativas/novo' element={<UnidadesAdministrativasCreatePage />} />
          <Route path='/unidades-administrativas/:id' element={<UnidadesAdministrativasViewPage />} />
          {/* Submódulo: Unidades Orçamentárias */}
          <Route path='/unidades-orcamentarias' element={<UnidadesOrcamentariasListPage />} />
          <Route path='/unidades-orcamentarias/novo' element={<UnidadesOrcamentariasCreatePage />} />
          <Route path='/unidades-orcamentarias/:id' element={<UnidadesOrcamentariasViewPage />} />
          {/* Submódulo: Usuários */}
          <Route path='/usuarios' element={<UsuariosListPage />} />
          <Route path='/usuarios/novo' element={<AdicionarUsuarioPage />} />
          <Route path='/usuarios/:id' element={<ViewUsuarioPage />} />
          <Route path='/usuarios/:id/editar' element={<EditarUsuarioPage />} />
        </Route>
      </Route>

      {/* Rota de fallback */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
