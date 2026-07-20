import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import {
  UnidadesListTable,
  type UnidadesListTableColumn,
  type UnidadesListTableHeader,
} from '@/components/UnidadesListTable';
import type { Usuario } from '@/modules/configuracoes/usuarios/service/usuario.service';
import { usePagination } from '../hooks/usePagination';
import {
  UA_USUARIOS_PAGE_SIZE,
  useUnidadeAdministrativaUsuarios,
} from '../hooks/useUnidadeAdministrativaUsuarios';

interface UnidadeAdministrativaUsuariosSectionProps {
  unidadeId: number;
}

const HEADERS: ReadonlyArray<UnidadesListTableHeader<string>> = [
  { label: 'Nome', key: 'nome', sortable: false },
  { label: 'RF', key: 'rf', sortable: false },
];

const COLUMNS: ReadonlyArray<UnidadesListTableColumn<Usuario>> = [
  { key: 'nome', render: (usuario) => usuario.nome || usuario.username },
  { key: 'rf', render: (usuario) => usuario.rf || '-' },
];

/**
 * Seção "Usuários Associados" exibida na tela de visualização do cadastro
 * da Unidade Administrativa.
 *
 * Lista os usuários vinculados à UA (colunas Nome, RF e Ações) e a ação
 * "Visualizar" redireciona para a página de detalhamento do usuário,
 * servindo como atalho para consulta e edição conforme as permissões
 * já existentes no sistema.
 */
export function UnidadeAdministrativaUsuariosSection({
  unidadeId,
}: Readonly<UnidadeAdministrativaUsuariosSectionProps>) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const usuariosQuery = useUnidadeAdministrativaUsuarios({ unidadeId, page });

  const usuarios = usuariosQuery.data?.results ?? [];
  const totalItems = usuariosQuery.data?.count ?? 0;

  const { pages, totalPages } = usePagination({
    page,
    totalItems,
    pageSize: UA_USUARIOS_PAGE_SIZE,
  });

  // Usuários sem permissão para consultar o cadastro de usuários (ex.:
  // operadores) não devem ter a navegação comprometida: a seção
  // simplesmente não é exibida.
  if (usuariosQuery.isError) {
    return null;
  }

  const handleView = (usuario: Usuario) => {
    navigate(`/usuarios/${usuario.id}`);
  };

  return (
    <Card className='p-6'>
      <UnidadesListTable
        title='Usuários Associados'
        items={usuarios}
        loading={usuariosQuery.isLoading}
        loadingMessage='Carregando usuários associados...'
        emptyMessage='Nenhum usuário associado a esta Unidade Administrativa.'
        headers={HEADERS}
        columns={COLUMNS}
        page={page}
        pages={pages}
        totalPages={totalPages}
        onPageChange={setPage}
        onSort={() => undefined}
        onView={handleView}
        getRowKey={(usuario) => usuario.id}
        getViewAriaLabel={(usuario) =>
          `Visualizar usuário ${usuario.nome || usuario.username}`
        }
      />
    </Card>
  );
}