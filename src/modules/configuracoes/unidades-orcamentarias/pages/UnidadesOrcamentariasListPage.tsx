import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { UnidadesOrcamentariasActions } from '../components/UnidadesOrcamentariasActions';
import { UnidadesOrcamentariasBreadcrumb } from '../components/UnidadesOrcamentariasBreadcrumb';
import { UnidadesOrcamentariasFilters } from '../components/UnidadesOrcamentariasFilters';
import { UnidadesOrcamentariasGuard } from '../components/UnidadesOrcamentariasGuard';
import {
  UnidadesOrcamentariasTable,
  type UnidadeOrcamentariaSortableField,
} from '../components/UnidadesOrcamentariasTable';
import { usePagination } from '../hooks/usePagination';
import { useUnidadeOrcamentariaList } from '../hooks/useUnidadeOrcamentariaList';
import { unidadesOrcamentariasService } from '../services/unidades-orcamentarias.service';
import type { UnidadeOrcamentariaExportFormat } from '../types/unidades-orcamentarias.types';

const PAGE_SIZE = 10;

const ORDERING_MAP: Record<string, string> = {
  codigo: 'codigo',
  sigla: 'sigla',
  nome: 'nome',
  status: 'ativa',
};

export default function UnidadesOrcamentariasListPage() {
  const navigate = useNavigate();
  const [reportLoading, setReportLoading] = useState(false);

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
  } = useUnidadeOrcamentariaList({ pageSize: PAGE_SIZE });

  const { pages, totalPages } = usePagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  });

  const handleSort = (field: UnidadeOrcamentariaSortableField) => {
    const backendField = ORDERING_MAP[field];
    setPage(1);

    setOrdering((current) => {
      if (current === backendField) {
        return `-${backendField}`;
      }

      if (current === `-${backendField}`) {
        return backendField;
      }

      return backendField;
    });
  };

  const handleReport = async (format: UnidadeOrcamentariaExportFormat) => {
    try {
      setReportLoading(true);

      const { blob, fileName } = await unidadesOrcamentariasService.exportar(format, {
        codigo: codigoFiltro,
        nomeOuSigla: nomeOuSiglaFiltro,
        ativa: statusFilter,
        ordering,
      });

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
    <UnidadesOrcamentariasGuard>
      <div className='space-y-4 p-8' data-testid='unidades-orcamentarias-list'>
        <UnidadesOrcamentariasBreadcrumb />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Unidades Orçamentárias
          </h1>

          <UnidadesOrcamentariasActions
            reportLoading={reportLoading}
            onBack={() => navigate(-1)}
            onAdd={() => navigate('/unidades-orcamentarias/novo')}
            onReport={handleReport}
          />
        </div>

        <Card className='space-y-6 p-6'>
          <UnidadesOrcamentariasFilters
            codigo={codigoInput}
            nomeOuSigla={nomeOuSiglaInput}
            status={statusFilter}
            onCodigoChange={setCodigoInput}
            onNomeOuSiglaChange={setNomeOuSiglaInput}
            onStatusChange={setStatusFilter}
          />

          <UnidadesOrcamentariasTable
            unidades={unidades}
            loading={loading || fetching}
            page={page}
            pages={pages}
            totalPages={totalPages}
            onPageChange={setPage}
            onSort={handleSort}
            onView={(id) => navigate(`/unidades-orcamentarias/${id}`)}
          />
        </Card>
      </div>
    </UnidadesOrcamentariasGuard>
  );
}