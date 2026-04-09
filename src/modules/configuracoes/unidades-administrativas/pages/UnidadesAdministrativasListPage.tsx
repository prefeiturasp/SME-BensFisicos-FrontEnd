import { Card } from '@/components/ui/card';
import { useAuth } from '@/auth/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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

    setOrdering((current) => {
      if (current === backendField) return `-${backendField}`;
      if (current === `-${backendField}`) return backendField;
      return backendField;
    });
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

      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Relatório exportado com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao exportar relatório.';
      toast.error(message);
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
