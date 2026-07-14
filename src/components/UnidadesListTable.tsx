import { type ReactNode } from 'react';
import { ArrowUpDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UnidadesPaginationItem } from '@/hooks/useUnidadesPagination';

export interface UnidadesListTableHeader<TField extends string> {
  label: string;
  field?: TField;
  sortable?: boolean;
  key?: string;
}

export interface UnidadesListTableColumn<TItem> {
  key: string;
  render: (item: TItem) => ReactNode;
  className?: string;
}

interface UnidadesListTableProps<TItem, TField extends string> {
  title: string;
  items: TItem[];
  loading: boolean;
  loadingMessage: string;
  emptyMessage: string;
  headers: ReadonlyArray<UnidadesListTableHeader<TField>>;
  columns: ReadonlyArray<UnidadesListTableColumn<TItem>>;
  page: number;
  pages: ReadonlyArray<UnidadesPaginationItem>;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: TField) => void;
  onView: (item: TItem) => void;
  getRowKey: (item: TItem) => number | string;
  getViewAriaLabel: (item: TItem) => string;
  renderActions?: (item: TItem) => ReactNode;
  hideDefaultActions?: boolean;
}

const ACTIVE_PAGE_CLASS = 'border-[#00703C] bg-[#00703C] text-white hover:bg-[#00703C]';

export function UnidadesListTable<TItem, TField extends string>({
  title,
  items,
  loading,
  loadingMessage,
  emptyMessage,
  headers,
  columns,
  page,
  pages,
  totalPages,
  onPageChange,
  onSort,
  onView,
  getRowKey,
  getViewAriaLabel,
  renderActions,
  hideDefaultActions = false,
}: Readonly<UnidadesListTableProps<TItem, TField>>) {
  return (
    <div className='space-y-4'>
      <p className='text-sm font-semibold text-[#00703C]'>{title}</p>

      <div className='overflow-x-auto rounded-md border border-gray-200'>
        <table className='w-full min-w-190 text-sm'>
          <thead className='border-b bg-[#F5F5F5] text-left text-gray-700'>
            <tr>
              {headers.map((header) => {
                const field = header.field;
                const isSortable = header.sortable !== false && Boolean(field);

                return (
                  <th key={header.key ?? field ?? header.label} className='p-3'>
                    {isSortable && field ? (
                      <button
                        type='button'
                        className='inline-flex items-center gap-2 font-semibold'
                        onClick={() => onSort(field)}
                      >
                        {header.label}
                        <ArrowUpDown size={14} />
                      </button>
                    ) : (
                      <span className='font-semibold'>{header.label}</span>
                    )}
                  </th>
                );
              })}
              <th className='p-3 text-center font-semibold'>Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={headers.length + 1} className='p-8 text-center text-gray-500'>
                  {loadingMessage}
                </td>
              </tr>
            )}

            {!loading && !items.length && (
              <tr>
                <td colSpan={headers.length + 1} className='p-8 text-center text-gray-500'>
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              items.map((item) => (
                <tr key={getRowKey(item)} className='border-b last:border-b-0 hover:bg-gray-50'>
                  {columns.map((column) => (
                    <td key={column.key} className={column.className ?? 'p-3'}>
                      {column.render(item)}
                    </td>
                  ))}
                  <td className='p-3'>
                    <div className='flex items-center justify-center'>
                      {renderActions ? (
                        renderActions(item)
                      ) : hideDefaultActions ? null : (
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          onClick={() => onView(item)}
                          aria-label={getViewAriaLabel(item)}
                        >
                          <Eye size={18} className='text-[#00703C]' />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className='flex justify-center'>
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label='Página anterior'
          >
            ‹
          </Button>

          {pages.map((item) =>
            item.type === 'ellipsis' ? (
              <span key={item.id} className='px-2 text-gray-500'>
                ...
              </span>
            ) : (
              <Button
                key={item.id}
                type='button'
                size='sm'
                variant='outline'
                onClick={() => onPageChange(item.value)}
                className={page === item.value ? ACTIVE_PAGE_CLASS : ''}
              >
                {item.value}
              </Button>
            ),
          )}

          <Button
            type='button'
            size='icon'
            variant='ghost'
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label='Próxima página'
          >
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}