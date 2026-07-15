import { Eye, Loader2 } from 'lucide-react';
import {
  UnidadesListTable,
  type UnidadesListTableColumn,
  type UnidadesListTableHeader,
} from '@/components/UnidadesListTable';
import { Button } from '@/components/ui/button';
import type { UnidadesPaginationItem } from '@/hooks/useUnidadesPagination';
import { ConciliacaoItemSituacaoBadge } from './ConciliacaoItemSituacaoBadge';
import type {
  ConciliacaoItem,
  ConciliacaoItemSortableField,
} from '../types/conciliacoes.types';

export type { ConciliacaoItemSortableField } from '../types/conciliacoes.types';

interface Props {
  itens: ConciliacaoItem[];
  loading: boolean;
  fetching?: boolean;
  page: number;
  pages: ReadonlyArray<UnidadesPaginationItem>;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: ConciliacaoItemSortableField) => void;
}

const HEADERS: ReadonlyArray<UnidadesListTableHeader<ConciliacaoItemSortableField>> = [
  { label: 'Número Patrimonial', field: 'bem__numero_patrimonial' },
  { label: 'Nome do bem', field: 'bem__nome' },
  { label: 'Situação', field: 'situacao' },
  { label: 'Observação / Divergência', key: 'observacao' },
];

function buildObservacao(item: ConciliacaoItem) {
  const partes: string[] = [];
  if (item.observacao?.trim()) {
    partes.push(item.observacao.trim());
  }
  if (item.divergencia?.trim()) {
    partes.push(item.divergencia.trim());
  }
  return partes.join(' / ');
}

export function ConciliacaoItensTable({
  itens,
  loading,
  fetching = false,
  page,
  pages,
  totalPages,
  onPageChange,
  onSort,
}: Readonly<Props>) {
  const columns = [
    { key: 'numero_patrimonial', render: (item: ConciliacaoItem) => item.bem.numero_patrimonial },
    {
      key: 'nome',
      className: 'p-3 align-top whitespace-pre-line break-words max-w-md',
      render: (item: ConciliacaoItem) => item.bem.nome,
    },
    {
      key: 'situacao',
      render: (item: ConciliacaoItem) => (
        <ConciliacaoItemSituacaoBadge situacao={item.situacao} />
      ),
    },
    {
      key: 'observacao',
      className: 'p-3 align-top whitespace-pre-line break-words max-w-md',
      render: (item: ConciliacaoItem) => buildObservacao(item),
    },
  ] satisfies ReadonlyArray<UnidadesListTableColumn<ConciliacaoItem>>;

  return (
    <div className='space-y-2'>
      {fetching && !loading && (
        <p
          className='flex items-center gap-2 text-xs text-gray-500'
          role='status'
          aria-live='polite'
          data-testid='conciliacao-itens-fetching'
        >
          <Loader2 size={14} className='animate-spin' aria-hidden='true' />
          Atualizando itens...
        </p>
      )}

      <UnidadesListTable<ConciliacaoItem, ConciliacaoItemSortableField>
        title=''
        items={itens}
        loading={loading}
        loadingMessage='Carregando itens...'
        emptyMessage='Nenhum item encontrado para esta conciliação.'
        headers={HEADERS}
        columns={columns}
        page={page}
        pages={pages}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onSort={onSort}
        onView={() => undefined}
        getRowKey={(item) => item.id}
        getViewAriaLabel={(item) => `Visualizar item ${item.bem.numero_patrimonial}`}
        renderActions={(item) => (
          <Button
            type='button'
            size='icon'
            variant='ghost'
            aria-label={`Visualizar item ${item.bem.numero_patrimonial}`}
            data-testid={`conciliacao-item-action-${item.id}`}
          >
            <Eye size={18} className='text-[#00703C]' />
          </Button>
        )}
        hideDefaultActions
      />
    </div>
  );
}
