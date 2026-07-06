import { useCallback, useMemo, useState } from 'react';
import {
  UnidadesListTable,
  type UnidadesListTableColumn,
  type UnidadesListTableHeader,
} from '@/components/UnidadesListTable';
import type { UnidadesPaginationItem } from '@/hooks/useUnidadesPagination';
import { ConciliacoesItensExpander } from './ConciliacoesItensExpander';
import { ConciliacaoStatusBadge } from './ConciliacaoStatusBadge';
import { ConciliacaoTipoBadge } from './ConciliacaoTipoBadge';
import type { Conciliacao, ConciliacaoSortableField } from '../types/conciliacoes.types';

export type { ConciliacaoSortableField } from '../types/conciliacoes.types';

interface Props {
  conciliacoes: Conciliacao[];
  loading: boolean;
  page: number;
  pages: ReadonlyArray<UnidadesPaginationItem>;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: ConciliacaoSortableField) => void;
  onView: (id: number) => void;
}

const HEADERS: ReadonlyArray<UnidadesListTableHeader<ConciliacaoSortableField>> = [
  { label: 'Número da Conciliação', field: 'id' },
  { label: 'Unidade Administrativa', field: 'unidade_administrativa__codigo' },
  { label: 'Tipo', field: 'tipo' },
  { label: 'Período', field: 'periodo_final' },
  { label: 'Itens' },
  { label: 'Status', field: 'status' },
];

const UA_CLASS = 'p-3 align-middle';
const ITENS_CLASS = 'p-3 align-middle';

function formatUnidadeAdministrativa(conciliacao: Conciliacao) {
  if (conciliacao.unidade_administrativa_sigla) {
    return `${conciliacao.unidade_administrativa_codigo} - ${conciliacao.unidade_administrativa_sigla}`;
  }

  return `${conciliacao.unidade_administrativa_codigo} - ${conciliacao.unidade_administrativa_nome}`;
}

function formatPeriodo(periodoFinal: string) {
  if (!periodoFinal) {
    return '';
  }

  const [year, month, day] = periodoFinal.split('-');
  if (!year || !month || !day) {
    return periodoFinal;
  }

  return `Até ${day}/${month}/${year}`;
}

export function ConciliacoesTable({
  conciliacoes,
  loading,
  page,
  pages,
  totalPages,
  onPageChange,
  onSort,
  onView,
}: Readonly<Props>) {
  const [openConciliacaoId, setOpenConciliacaoId] = useState<number | null>(null);

  const handleOpenChange = useCallback((conciliacaoId: number, open: boolean) => {
    setOpenConciliacaoId((current) => {
      if (open) return conciliacaoId;
      if (current === conciliacaoId) return null;
      return current;
    });
  }, []);

  const columns = useMemo<ReadonlyArray<UnidadesListTableColumn<Conciliacao>>>(
    () => [
      { key: 'numero', render: (conciliacao) => conciliacao.numero_conciliacao },
      {
        key: 'ua',
        render: (conciliacao) => formatUnidadeAdministrativa(conciliacao),
        className: UA_CLASS,
      },
      {
        key: 'tipo',
        render: (conciliacao) => <ConciliacaoTipoBadge tipo={conciliacao.tipo} />,
      },
      {
        key: 'periodo',
        render: (conciliacao) => formatPeriodo(conciliacao.periodo_final),
      },
      {
        key: 'itens',
        render: (conciliacao) => (
          <ConciliacoesItensExpander
            conciliacaoId={conciliacao.id}
            totalItens={conciliacao.total_itens}
            resumo={conciliacao.resumo_situacoes}
            isOpen={openConciliacaoId === conciliacao.id}
            onOpenChange={(open) => handleOpenChange(conciliacao.id, open)}
          />
        ),
        className: ITENS_CLASS,
      },
      {
        key: 'status',
        render: (conciliacao) => <ConciliacaoStatusBadge status={conciliacao.status} />,
      },
    ],
    [openConciliacaoId, handleOpenChange],
  );

  return (
    <UnidadesListTable
      title='Conciliações Cadastradas'
      items={conciliacoes}
      loading={loading}
      loadingMessage='Carregando conciliações...'
      emptyMessage='Nenhuma conciliação encontrada.'
      headers={HEADERS}
      columns={columns}
      page={page}
      pages={pages}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onSort={onSort}
      onView={(conciliacao) => onView(conciliacao.id)}
      getRowKey={(conciliacao) => conciliacao.id}
      getViewAriaLabel={(conciliacao) => `Visualizar conciliação ${conciliacao.numero_conciliacao}`}
    />
  );
}
