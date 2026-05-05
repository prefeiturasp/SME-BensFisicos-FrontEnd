import { Card } from '@/components/ui/card';
import { useAuth } from '@/auth/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { downloadBlobFile, getErrorMessage, toggleOrdering } from '@/lib/unidades-list-page';
import { UnidadesAdministrativasActions } from '../components/UnidadesAdministrativasActions';
import { UnidadesAdministrativasBreadcrumb } from '../components/UnidadesAdministrativasBreadcrumb';
import { UnidadesAdministrativasFilters } from '../components/UnidadesAdministrativasFilters';
import { UnidadesAdministrativasTable } from '../components/UnidadesAdministrativasTable';
import { usePagination } from '../hooks/usePagination';
import { useUnidadeAdministrativaList } from '../hooks/useUnidadeAdministrativaList';
import { unidadesAdministrativasService } from '../services/unidades-administrativas.service';
import type { UnidadeAdministrativaExportFormat } from '../types/unidades-administrativas.types';

const PAGE_SIZE = 10;

const ORDERING_MAP: Record<string, string> = {
  codigo: 'codigo',
  sigla: 'sigla',
  nome: 'nome',
  status: 'status',
};

export default function UnidadesAdministrativasListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    unidades,
    page,
    count,
    loading,
    fetching,
    ordering,
    codigoInput,
    nomeOuSiglaInput,
    codigoFiltro,
    nomeOuSiglaFiltro,
    statusFilter,
    setPage,
    setOrdering,
    setCodigoInput,
    setNomeOuSiglaInput,
    setStatusFilter,
  } = useUnidadeAdministrativaList({ pageSize: PAGE_SIZE });
  const [reportLoading, setReportLoading] = useState(false);

  const { pages, totalPages } = usePagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  });

  const canManage = Boolean(user?.is_gestor_patrimonio);

  const handleSort = (field: string) => {
    const backendField = ORDERING_MAP[field] ?? field;
    setPage(1);

    setOrdering((current) => toggleOrdering(current, backendField));
  };

  const handleReport = async (format: UnidadeAdministrativaExportFormat) => {
    if (reportLoading) {
      return;
    }

    try {
      setReportLoading(true);

      const reportParams = {
        codigo: codigoFiltro,
        nomeOuSigla: nomeOuSiglaFiltro,
        status: statusFilter,
        ordering,
      };

      const { blob, fileName } = await unidadesAdministrativasService.exportar(format, reportParams);

      downloadBlobFile(blob, fileName);

      toast.success('Relatório exportado com sucesso.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Erro ao exportar relatório.'));
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className='space-y-4 p-8'>
      <UnidadesAdministrativasBreadcrumb />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>Unidades Administrativas</h1>

        <UnidadesAdministrativasActions
          canManage={canManage}
          reportLoading={reportLoading}
          onBack={() => navigate(-1)}
          onAdd={() => navigate('/unidades-administrativas/novo')}
          onReport={handleReport}
        />
      </div>

      <Card className='space-y-6 p-6'>
        <UnidadesAdministrativasFilters
          codigo={codigoInput}
          nomeOuSigla={nomeOuSiglaInput}
          status={statusFilter}
          onCodigoChange={setCodigoInput}
          onNomeOuSiglaChange={setNomeOuSiglaInput}
          onStatusChange={setStatusFilter}
        />

        <UnidadesAdministrativasTable
          unidades={unidades}
          loading={loading || fetching}
          page={page}
          pages={pages}
          totalPages={totalPages}
          onPageChange={setPage}
          onSort={handleSort}
          onView={(id) => navigate(`/unidades-administrativas/${id}`)}
        />
      </Card>
    </div>
  );
}
