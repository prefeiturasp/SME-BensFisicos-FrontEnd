import { ArrowUpDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UnidadeOrcamentaria } from '../types/unidades-orcamentarias.types';

export type UnidadeOrcamentariaSortableField = 'codigo' | 'sigla' | 'nome' | 'status';

type PaginationItem =
  | { type: 'page'; value: number; id: string }
  | { type: 'ellipsis'; id: string };

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

const HEADERS: Array<{ label: string; field: UnidadeOrcamentariaSortableField }> = [
  { label: 'Código', field: 'codigo' },
  { label: 'Sigla', field: 'sigla' },
  { label: 'Nome', field: 'nome' },
  { label: 'Status', field: 'status' },
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
    <div className='space-y-4'>
      <p className='text-sm font-semibold text-[#00703C]'>Unidades Orçamentárias Cadastradas</p>

      <div className='overflow-x-auto rounded-md border border-gray-200'>
        <table className='w-full min-w-190 text-sm'>
          <thead className='border-b bg-[#F5F5F5] text-left text-gray-700'>
            <tr>
              {HEADERS.map((header) => (
                <th key={header.field} className='p-3'>
                  <button
                    type='button'
                    className='inline-flex items-center gap-2 font-semibold'
                    onClick={() => onSort(header.field)}
                  >
                    {header.label}
                    <ArrowUpDown size={14} />
                  </button>
                </th>
              ))}
              <th className='p-3 text-center font-semibold'>Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className='p-8 text-center text-gray-500'>
                  Carregando unidades orçamentárias...
                </td>
              </tr>
            )}

            {!loading && !unidades.length && (
              <tr>
                <td colSpan={5} className='p-8 text-center text-gray-500'>
                  Nenhuma unidade orçamentária encontrada.
                </td>
              </tr>
            )}

            {!loading &&
              unidades.map((unidade) => (
                <tr key={unidade.id} className='border-b last:border-b-0 hover:bg-gray-50'>
                  <td className='p-3'>{unidade.codigo}</td>
                  <td className='p-3'>{unidade.sigla || '-'}</td>
                  <td className='p-3'>{unidade.nome}</td>
                  <td className='p-3'>{unidade.ativa_display}</td>
                  <td className='p-3'>
                    <div className='flex items-center justify-center'>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        onClick={() => onView(unidade.id)}
                        aria-label={`Visualizar unidade orçamentária ${unidade.nome}`}
                      >
                        <Eye size={18} className='text-[#00703C]' />
                      </Button>
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
                className={
                  page === item.value
                    ? 'border-[#00703C] bg-[#00703C] text-white hover:bg-[#00703C]'
                    : ''
                }
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