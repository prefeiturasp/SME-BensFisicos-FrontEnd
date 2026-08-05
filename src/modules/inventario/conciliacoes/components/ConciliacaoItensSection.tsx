import { useUnidadesPagination } from '@/hooks/useUnidadesPagination';
import { toggleOrdering } from '@/lib/unidades-list-page';
import { ConciliacaoItensFilters } from './ConciliacaoItensFilters';
import { ConciliacaoItensTable, type ConciliacaoItemSortableField } from './ConciliacaoItensTable';
import type {
  ConciliacaoItemSituacaoFilter,
  ConciliacaoItem,
} from '../types/conciliacoes.types';

interface ConciliacaoItensSectionProps {
  itens: ConciliacaoItem[];
  count: number;
  loading: boolean;
  fetching: boolean;
  page: number;
  pageSize: number;
  numeroPatrimonial: string;
  nome: string;
  situacao: ConciliacaoItemSituacaoFilter;
  ordering: ConciliacaoItemSortableField;
  onPageChange: (page: number) => void;
  onOrderingChange: (field: ConciliacaoItemSortableField) => void;
  onNumeroPatrimonialChange: (value: string) => void;
  onNomeChange: (value: string) => void;
  onSituacaoChange: (value: ConciliacaoItemSituacaoFilter) => void;
  onSelectItem?: (item: ConciliacaoItem) => void;
}

export function ConciliacaoItensSection({
  itens,
  count,
  loading,
  fetching,
  page,
  pageSize,
  numeroPatrimonial,
  nome,
  situacao,
  ordering,
  onPageChange,
  onOrderingChange,
  onNumeroPatrimonialChange,
  onNomeChange,
  onSituacaoChange,
  onSelectItem,
}: Readonly<ConciliacaoItensSectionProps>) {
  const { pages, totalPages } = useUnidadesPagination({
    page,
    totalItems: count,
    pageSize,
  });

  const handleSort = (field: ConciliacaoItemSortableField) => {
    onOrderingChange(toggleOrdering(ordering, field) as ConciliacaoItemSortableField);
  };

  return (
    <section
      className='space-y-5 p-4'
      data-testid='conciliacao-itens-section'
      aria-label='Itens de conciliação'
    >
      <h2 className='text-base font-semibold text-[#2F7D57]'>Itens de conciliação</h2>

      <ConciliacaoItensFilters
        numeroPatrimonial={numeroPatrimonial}
        nome={nome}
        situacao={situacao}
        onNumeroPatrimonialChange={onNumeroPatrimonialChange}
        onNomeChange={onNomeChange}
        onSituacaoChange={onSituacaoChange}
      />

      <ConciliacaoItensTable
        itens={itens}
        loading={loading}
        fetching={fetching}
        page={page}
        pages={pages}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onSort={handleSort}
        onSelectItem={onSelectItem}
      />
    </section>
  );
}
