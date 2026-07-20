import { ArrowLeft, Plus, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUnidadesPagination } from '@/hooks/useUnidadesPagination';
import { toggleOrdering } from '@/lib/unidades-list-page';
import { ConciliacoesFilters } from '../components/ConciliacoesFilters';
import { ConciliacoesListBreadcrumb } from '../components/ConciliacoesListBreadcrumb';
import { ConciliacoesTable, type ConciliacaoSortableField } from '../components/ConciliacoesTable';
import { useConciliacoesList } from '../hooks/useConciliacoes';
import { canAccessConciliacoes } from '../utils/permissions';

const PAGE_SIZE = 10;

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`;

const ICON_BUTTON_CLASS = `
  h-10 w-10 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white rounded-md transition-colors
  flex items-center justify-center
`;

const RELATORIO_BUTTON_CLASS = `
  h-10 px-6 bg-gray-100 border border-gray-300
  text-gray-500 font-semibold rounded-md transition-colors
  flex items-center gap-2
`;

export default function GerenciamentoConciliacoesListPage() {
  const { user } = useAuth();
  const canAccess = canAccessConciliacoes(user);

  if (!canAccess) {
    return (
      <div className='space-y-4 p-8' data-testid='gerenciamento-conciliacoes-list'>
        <ConciliacoesListBreadcrumb />
        <Card className='p-6 text-sm text-red-700'>
          Você não tem permissão para acessar o Gerenciamento de Conciliações.
        </Card>
      </div>
    );
  }

  return <GerenciamentoConciliacoesListContent />;
}

function GerenciamentoConciliacoesListContent() {
  const navigate = useNavigate();
  const {
    conciliacoes,
    page,
    count,
    loading,
    fetching,
    searchInput,
    anoVigenciaInput,
    tipoFilter,
    statusFilter,
    setPage,
    setOrdering,
    setSearchInput,
    setAnoVigenciaInput,
    setTipoFilter,
    setStatusFilter,
  } = useConciliacoesList({ pageSize: PAGE_SIZE });

  const { pages, totalPages } = useUnidadesPagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  });

  const handleSort = (field: ConciliacaoSortableField) => {
    setPage(1);
    setOrdering((current) => toggleOrdering(current, field));
  };

  return (
    <div className='space-y-4 p-8' data-testid='gerenciamento-conciliacoes-list'>
      <ConciliacoesListBreadcrumb />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Gerenciamento de Conciliações
        </h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            aria-label='Voltar'
            onClick={() => navigate('/home')}
            className={ICON_BUTTON_CLASS}
          >
            <ArrowLeft size={18} />
          </Button>

          <Button
            type='button'
            onClick={() => navigate('/conciliacoes/novo')}
            className={ACTION_BUTTON_CLASS}
          >
            <Plus size={16} className='mr-1' />
            Adicionar Conciliação
          </Button>

          <Button
            type='button'
            disabled
            className={RELATORIO_BUTTON_CLASS}
            aria-label='Relatório'
            data-testid='relatorio-button'
          >
            <Printer size={16} />
            Relatório
          </Button>
        </div>
      </div>

      <Card className='space-y-6 p-8'>
        <ConciliacoesFilters
          search={searchInput}
          anoVigencia={anoVigenciaInput}
          tipo={tipoFilter}
          status={statusFilter}
          onSearchChange={setSearchInput}
          onAnoVigenciaChange={setAnoVigenciaInput}
          onTipoChange={setTipoFilter}
          onStatusChange={setStatusFilter}
        />

        <ConciliacoesTable
          conciliacoes={conciliacoes}
          loading={loading || fetching}
          page={page}
          pages={pages}
          totalPages={totalPages}
          onPageChange={setPage}
          onSort={handleSort}
          onView={(id) => navigate(`/conciliacoes/${id}`)}
        />
      </Card>
    </div>
  );
}
