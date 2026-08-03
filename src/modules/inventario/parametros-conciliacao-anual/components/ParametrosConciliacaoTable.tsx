import {
  UnidadesListTable,
  type UnidadesListTableColumn,
  type UnidadesListTableHeader,
} from '@/components/UnidadesListTable';
import type { UnidadesPaginationItem } from '@/hooks/useUnidadesPagination';
import type { ParametroConciliacaoAnual } from '../types/parametros-conciliacao-anual.types';

export type ParametroConciliacaoSortableField =
  | 'unidade_orcamentaria__codigo'
  | 'ano_referencia'
  | 'periodo_final'
  | 'ativo';

interface Props {
  parametros: ParametroConciliacaoAnual[];
  loading: boolean;
  page: number;
  pages: UnidadesPaginationItem[];
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: ParametroConciliacaoSortableField) => void;
  onView: (id: number) => void;
}

const HEADERS: ReadonlyArray<UnidadesListTableHeader<ParametroConciliacaoSortableField>> = [
  { label: 'Unidade Orçamentária', field: 'unidade_orcamentaria__codigo' },
  { label: 'Ano de Referência', field: 'ano_referencia' },
  { label: 'Período Final Permitido', field: 'periodo_final' },
  { label: 'Status', field: 'ativo' },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatUo(parametro: ParametroConciliacaoAnual) {
  return `${parametro.unidade_orcamentaria_codigo} - ${parametro.unidade_orcamentaria_nome}`;
}

const COLUMNS: ReadonlyArray<UnidadesListTableColumn<ParametroConciliacaoAnual>> = [
  { key: 'uo', render: formatUo },
  { key: 'ano', render: (parametro) => parametro.ano_referencia },
  { key: 'periodo_final', render: (parametro) => formatDate(parametro.periodo_final) },
  { key: 'status', render: (parametro) => (parametro.ativo ? 'Ativo' : 'Inativo') },
];

export function ParametrosConciliacaoTable({
  parametros,
  loading,
  page,
  pages,
  totalPages,
  onPageChange,
  onSort,
  onView,
}: Readonly<Props>) {
  return (
    <UnidadesListTable
      title='Parâmetros Cadastrados'
      items={parametros}
      loading={loading}
      loadingMessage='Carregando parâmetros de conciliação anual...'
      emptyMessage='Nenhum parâmetro de conciliação anual encontrado.'
      headers={HEADERS}
      columns={COLUMNS}
      page={page}
      pages={pages}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onSort={onSort}
      onView={(parametro) => onView(parametro.id)}
      getRowKey={(parametro) => parametro.id}
      getViewAriaLabel={(parametro) => `Visualizar parâmetro ${parametro.ano_referencia}`}
    />
  );
}
