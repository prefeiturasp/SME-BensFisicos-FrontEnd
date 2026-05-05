import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUnidadesPagination } from '@/hooks/useUnidadesPagination';
import { toggleOrdering } from '@/lib/unidades-list-page';
import { ParametrosConciliacaoBreadcrumb } from '../components/ParametrosConciliacaoBreadcrumb';
import { ParametrosConciliacaoFilters } from '../components/ParametrosConciliacaoFilters';
import {
  ParametrosConciliacaoTable,
  type ParametroConciliacaoSortableField,
} from '../components/ParametrosConciliacaoTable';
import { useParametrosConciliacaoAnualList } from '../hooks/useParametrosConciliacaoAnual';
import { canAccessParametrosConciliacao } from '../utils/permissions';

const PAGE_SIZE = 10;

const ACTION_BUTTON_CLASS =
  'h-10 px-4 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

export default function ParametrosConciliacaoAnualListPage() {
  const { user } = useAuth();
  const canAccessParametros = canAccessParametrosConciliacao(user);

  if (!canAccessParametros) {
    return (
      <div className='space-y-4 p-8'>
        <ParametrosConciliacaoBreadcrumb />
        <Card className='p-6 text-sm text-red-700'>
          Você não tem permissão para acessar Parâmetros de Conciliação Anual.
        </Card>
      </div>
    );
  }

  return <ParametrosConciliacaoAnualListContent />;
}

function ParametrosConciliacaoAnualListContent() {
  const navigate = useNavigate();
  const {
    parametros,
    page,
    count,
    loading,
    fetching,
    anoInput,
    statusFilter,
    setPage,
    setOrdering,
    setAnoInput,
    setStatusFilter,
  } = useParametrosConciliacaoAnualList({ pageSize: PAGE_SIZE });

  const { pages, totalPages } = useUnidadesPagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  });

  const handleSort = (field: ParametroConciliacaoSortableField) => {
    setPage(1);
    setOrdering((current) => toggleOrdering(current, field));
  };

  return (
    <div className='space-y-4 p-8' data-testid='parametros-conciliacao-list'>
      <ParametrosConciliacaoBreadcrumb />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Parâmetros de Conciliação Anual
        </h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            onClick={() => navigate(-1)}
            className={ACTION_BUTTON_CLASS}
            aria-label='Voltar'
          >
            <ArrowLeft size={16} />
          </Button>
          <Button
            type='button'
            className={ACTION_BUTTON_CLASS}
            onClick={() => {
              toast.dismiss();
              navigate('/parametros-conciliacao-anual/novo');
            }}
          >
            <Plus size={16} />
            Adicionar Parâmetro
          </Button>
        </div>
      </div>

      <Card className='space-y-6 p-8'>
        <ParametrosConciliacaoFilters
          ano={anoInput}
          status={statusFilter}
          onAnoChange={setAnoInput}
          onStatusChange={setStatusFilter}
        />

        <ParametrosConciliacaoTable
          parametros={parametros}
          loading={loading || fetching}
          page={page}
          pages={pages}
          totalPages={totalPages}
          onPageChange={setPage}
          onSort={handleSort}
          onView={(id) => navigate(`/parametros-conciliacao-anual/${id}`)}
        />
      </Card>
    </div>
  );
}
