import { ArrowLeft, ArrowUpDown, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { CriadoPorValue } from '@/components/CriadoPorValue';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUnidadesPagination } from '@/hooks/useUnidadesPagination';
import { formatUsuarioObjetoLabel } from '@/lib/usuario-label';
import { useNbbpmList } from '../hooks/useNbbpmList';
import type { NbbpmListItem } from '../types/nbbpm.types';
import { formatBaixaRef, formatDataBR, formatDataHoraBR } from '../utils/formatters';
import type { NbbpmSort, NbbpmSortField } from '../utils/ordering';
import { canAccessNbbpm } from '../utils/permissions';

const PAGE_SIZE = 10;
const TABLE_COLUMNS_COUNT = 7;
const PAGE_TITLE = 'Notas de Baixa de Bens Patrimoniais (NBBPM)';

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`;

const INPUT_CLASS =
  'h-10 w-full rounded-xs border border-gray-300 bg-white px-3 pl-10 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]';

const ACTIVE_PAGE_CLASS = 'border-[#00703C] bg-[#00703C] text-white hover:bg-[#00703C]';

const BREADCRUMB_ITEMS = [
  { label: 'Bem Patrimonial' },
  { label: 'Notas de Baixa de Bens Patrimoniais', isActive: true },
];

type AriaSort = 'ascending' | 'descending' | 'none';

function getAriaSort(sort: NbbpmSort, field: NbbpmSortField): AriaSort {
  if (sort.field !== field) return 'none';
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

type SortableHeaderProps = Readonly<{
  label: string;
  field: NbbpmSortField;
  sort: NbbpmSort;
  onSort: (field: NbbpmSortField) => void;
}>;

function SortableHeader({ label, field, sort, onSort }: SortableHeaderProps) {
  return (
    <th className='p-3' aria-sort={getAriaSort(sort, field)}>
      <Button
        type='button'
        variant='ghost'
        className='h-auto gap-2 p-0 font-semibold hover:bg-transparent'
        onClick={() => onSort(field)}
      >
        {label}
        <ArrowUpDown className='size-3.5' />
      </Button>
    </th>
  );
}

function BaixasVinculadas({ baixas }: Readonly<{ baixas: number[] }>) {
  if (baixas.length === 0) {
    return <span className='text-gray-400'>-</span>;
  }

  return (
    <div className='flex flex-wrap gap-x-3 gap-y-1'>
      {baixas.map((baixaId) => (
        <Tooltip key={baixaId}>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant='link'
              className='h-auto p-0 font-semibold text-[#00703C]'
              aria-label={`Visualizar Baixa Física ${baixaId}`}
            >
              <Link to={`/baixas-fisicas/${baixaId}`}>{formatBaixaRef(baixaId)}</Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side='top' sideOffset={6} className='max-w-70'>
            Visualizar as informações da Baixa Física.
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function NbbpmTableRow({ nbbpm }: Readonly<{ nbbpm: NbbpmListItem }>) {
  const ua = nbbpm.unidade_administrativa_origem;

  return (
    <tr className='border-b hover:bg-gray-50'>
      <td className='p-3 font-mono text-sm text-gray-700'>{nbbpm.numero || '-'}</td>
      <td className='p-3 text-sm text-gray-700'>{nbbpm.numero_processo_baixa || '-'}</td>
      <td className='p-3 text-sm text-gray-700'>{ua?.sigla || ua?.nome || '-'}</td>
      <td className='p-3 text-sm'>
        <BaixasVinculadas baixas={nbbpm.baixas} />
      </td>
      <td className='p-3 text-sm text-gray-600'>{formatDataBR(nbbpm.data_autorizacao)}</td>
      <td className='p-3 text-sm text-gray-600'>
        <CriadoPorValue
          label={formatUsuarioObjetoLabel(nbbpm.criado_por)}
          data-testid={`nbbpm-criado-por-${nbbpm.id}`}
        />
      </td>
      <td className='p-3 text-sm text-gray-500'>{formatDataHoraBR(nbbpm.data_criacao)}</td>
    </tr>
  );
}

type NbbpmTableBodyProps = Readonly<{
  loading: boolean;
  error: boolean;
  items: NbbpmListItem[];
}>;

function NbbpmTableBody({ loading, error, items }: NbbpmTableBodyProps) {
  if (loading) {
    return (
      <tr>
        <td colSpan={TABLE_COLUMNS_COUNT} className='py-10 text-center text-gray-500'>
          Carregando...
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={TABLE_COLUMNS_COUNT} className='py-10 text-center text-red-600'>
          Não foi possível carregar as NBBPMs.
        </td>
      </tr>
    );
  }

  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={TABLE_COLUMNS_COUNT} className='py-10 text-center text-gray-400'>
          Nenhuma NBBPM encontrada.
        </td>
      </tr>
    );
  }

  return (
    <>
      {items.map((nbbpm) => (
        <NbbpmTableRow key={nbbpm.id} nbbpm={nbbpm} />
      ))}
    </>
  );
}

export default function NbbpmListPage() {
  const { user } = useAuth();

  if (!canAccessNbbpm(user)) {
    return (
      <div className='space-y-4 p-8'>
        <AppBreadcrumb items={BREADCRUMB_ITEMS} />
        <Card className='p-6 text-sm text-red-700'>
          Você não tem permissão para acessar as Notas de Baixa de Bens Patrimoniais.
        </Card>
      </div>
    );
  }

  return <NbbpmListContent />;
}

function NbbpmListContent() {
  const navigate = useNavigate();
  const {
    items,
    count,
    loading,
    error,
    page,
    sort,
    searchInput,
    setPage,
    setSearchInput,
    handleSort,
  } = useNbbpmList({ pageSize: PAGE_SIZE });

  const { pages, totalPages } = useUnidadesPagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className='space-y-4 p-8'>
      <AppBreadcrumb items={BREADCRUMB_ITEMS} />

      {/* HEADER */}
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>{PAGE_TITLE}</h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            className={`${ACTION_BUTTON_CLASS} h-10 w-10 p-0`}
            aria-label='Voltar'
            onClick={() => navigate('/home')}
          >
            <ArrowLeft size={18} />
          </Button>
        </div>
      </div>

      <Card className='space-y-6 p-6'>
        {/* FILTRO */}
        <div className='flex flex-col gap-4 md:flex-row'>
          <div className='min-w-[200px] flex-1'>
            <label htmlFor='nbbpm-filtro-busca' className='text-sm font-semibold text-gray-700'>
              Buscar por NBBPM, Nº do Processo ou Unidade Administrativa
            </label>
            <div className='relative mt-1'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
              <Input
                id='nbbpm-filtro-busca'
                type='text'
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder='Nº da NBBPM, nº do processo ou UA'
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        <p className='text-sm font-semibold text-[#00703C]'>NBBPMs Geradas</p>

        {/* TABELA */}
        <div className='overflow-x-auto rounded-md border border-gray-200'>
          <table className='w-full text-sm'>
            <thead className='border-b bg-[#F5F5F5]'>
              <tr className='text-left font-semibold text-gray-600'>
                <th className='p-3'>Número da NBBPM</th>
                <th className='p-3'>Nº do Processo de Baixa</th>
                <th className='p-3'>Unidade Administrativa</th>
                <th className='p-3'>Baixas Físicas Vinculadas</th>
                <SortableHeader
                  label='Data da Autorização'
                  field='data_autorizacao'
                  sort={sort}
                  onSort={handleSort}
                />
                <th className='p-3'>Gerada por</th>
                <SortableHeader
                  label='Data de Criação'
                  field='data_criacao'
                  sort={sort}
                  onSort={handleSort}
                />
              </tr>
            </thead>

            <tbody>
              <NbbpmTableBody loading={loading} error={error} items={items} />
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO - padrão do sistema */}
        <div className='flex justify-center'>
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
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
                  onClick={() => setPage(item.value)}
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
              onClick={() => setPage((current) => current + 1)}
              aria-label='Próxima página'
            >
              ›
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
