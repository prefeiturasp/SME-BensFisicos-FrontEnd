import {
  UnidadesListTable,
  type UnidadesListTableColumn,
  type UnidadesListTableHeader,
} from '@/components/UnidadesListTable';
import type { PaginationItem } from '../hooks/usePagination';
import type { UnidadeOrcamentaria } from '../types/unidades-orcamentarias.types';

export type UnidadeOrcamentariaSortableField =
  | 'codigo'
  | 'sigla'
  | 'nome'
  | 'codigo_orgao'
  | 'sigla_orgao'
  | 'orgao'
  | 'status';

interface UnidadesOrcamentariasTableProps {
  unidades: UnidadeOrcamentaria[];
  loading: boolean;
  page: number;
  pages: PaginationItem[];
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: UnidadeOrcamentariaSortableField) => void;
  onView: (id: number) => void;
}

const HEADERS: ReadonlyArray<UnidadesListTableHeader<UnidadeOrcamentariaSortableField>> = [
  { label: 'Código', field: 'codigo' },
  { label: 'Sigla', field: 'sigla' },
  { label: 'Nome', field: 'nome' },
  { label: 'Código do órgão', field: 'codigo_orgao' },
  { label: 'Sigla do órgão', field: 'sigla_orgao' },
  { label: 'Nome do órgão', field: 'orgao' },
  { label: 'Status', field: 'status' },
];

const COLUMNS: ReadonlyArray<UnidadesListTableColumn<UnidadeOrcamentaria>> = [
  { key: 'codigo', render: (unidade) => unidade.codigo },
  { key: 'sigla', render: (unidade) => unidade.sigla || '-' },
  { key: 'nome', render: (unidade) => unidade.nome },
  { key: 'codigo_orgao', render: (unidade) => unidade.codigo_orgao || '-' },
  { key: 'sigla_orgao', render: (unidade) => unidade.sigla_orgao || '-' },
  { key: 'orgao', render: (unidade) => unidade.orgao || '-' },
  { key: 'status', render: (unidade) => unidade.ativa_display },
];

export function UnidadesOrcamentariasTable({
  unidades,
  loading,
  page,
  pages,
  totalPages,
  onPageChange,
  onSort,
  onView,
}: Readonly<UnidadesOrcamentariasTableProps>) {
  return (
    <UnidadesListTable
      title='Unidades Orçamentárias Cadastradas'
      items={unidades}
      loading={loading}
      loadingMessage='Carregando unidades orçamentárias...'
      emptyMessage='Nenhuma unidade orçamentária encontrada.'
      headers={HEADERS}
      columns={COLUMNS}
      page={page}
      pages={pages}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onSort={onSort}
      onView={(unidade) => onView(unidade.id)}
      getRowKey={(unidade) => unidade.id}
      getViewAriaLabel={(unidade) => `Visualizar unidade orçamentária ${unidade.nome}`}
    />
  );
}