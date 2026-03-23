import { ArrowUpDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UnidadeAdministrativa } from '../types/unidades-administrativas.types';

type PaginationItem =
  | { type: 'page'; value: number; id: string }
  | { type: 'ellipsis'; id: string };

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

const HEADERS = [
  { label: 'Código', field: 'codigo' },
  { label: 'Sigla', field: 'sigla' },
  { label: 'Nome', field: 'nome' },
  { label: 'Status', field: 'status' },
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
    <div className='space-y-4'>
      <p className='text-sm font-semibold text-[#00703C]'>Unidades Administrativas Cadastradas</p>

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
                  Carregando unidades administrativas...
                </td>
              </tr>
            )}

            {!loading && !unidades.length && (
              <tr>
                <td colSpan={5} className='p-8 text-center text-gray-500'>
                  Nenhuma unidade administrativa encontrada.
                </td>
              </tr>
            )}

            {!loading &&
              unidades.map((unidade) => (
                <tr key={unidade.id} className='border-b last:border-b-0 hover:bg-gray-50'>
                  <td className='p-3'>{unidade.codigo}</td>
                  <td className='p-3'>{unidade.sigla}</td>
                  <td className='p-3'>{unidade.nome}</td>
                  <td className='p-3'>{unidade.status_display}</td>
                  <td className='p-3'>
                    <div className='flex items-center justify-center'>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        onClick={() => onView(unidade.id)}
                        aria-label={`Visualizar unidade ${unidade.nome}`}
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
                    ? 'bg-[#00703C] text-white border-[#00703C] hover:bg-[#00703C]'
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
