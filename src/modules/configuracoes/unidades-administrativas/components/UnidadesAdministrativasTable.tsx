import {
  UnidadesListTable,
  type UnidadesListTableColumn,
  type UnidadesListTableHeader,
} from '@/components/UnidadesListTable';
import type { PaginationItem } from '../hooks/usePagination';
import type { UnidadeAdministrativa } from '../types/unidades-administrativas.types';

interface UnidadesAdministrativasTableProps {
  unidades: UnidadeAdministrativa[];
  loading: boolean;
  page: number;
  pages: PaginationItem[];
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  onView: (id: number) => void;
}

const HEADERS: ReadonlyArray<UnidadesListTableHeader<string>> = [
  { label: 'Código', field: 'codigo' },
  { label: 'Sigla', field: 'sigla' },
  { label: 'Nome', field: 'nome' },
  { label: 'Status', field: 'status' },
];

const COLUMNS: ReadonlyArray<UnidadesListTableColumn<UnidadeAdministrativa>> = [
  { key: 'codigo', render: (unidade) => unidade.codigo },
  { key: 'sigla', render: (unidade) => unidade.sigla },
  { key: 'nome', render: (unidade) => unidade.nome },
  { key: 'status', render: (unidade) => unidade.status_display },
];

export function UnidadesAdministrativasTable({
  unidades,
  loading,
  page,
  pages,
  totalPages,
  onPageChange,
  onSort,
  onView,
}: Readonly<UnidadesAdministrativasTableProps>) {
  return (
    <UnidadesListTable
      title='Unidades Administrativas Cadastradas'
      items={unidades}
      loading={loading}
      loadingMessage='Carregando unidades administrativas...'
      emptyMessage='Nenhuma unidade administrativa encontrada.'
      headers={HEADERS}
      columns={COLUMNS}
      page={page}
      pages={pages}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onSort={onSort}
      onView={(unidade) => onView(unidade.id)}
      getRowKey={(unidade) => unidade.id}
      getViewAriaLabel={(unidade) => `Visualizar unidade ${unidade.nome}`}
    />
  );
}
