import { Plus } from 'lucide-react';
import {
  UnidadesListActions,
  type UnidadesListReportFormatOption,
} from '@/components/UnidadesListActions';
import type { UnidadeOrcamentariaExportFormat } from '../types/unidades-orcamentarias.types';

interface UnidadesOrcamentariasActionsProps {
  reportLoading: boolean;
  onBack: () => void;
  onAdd: () => void;
  onReport: (format: UnidadeOrcamentariaExportFormat) => void;
}

const ACTION_BUTTON_CLASS =
  'h-10 px-4 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const REPORT_FORMATS: ReadonlyArray<
  UnidadesListReportFormatOption<UnidadeOrcamentariaExportFormat>
> = [
  { value: 'csv', label: 'Exportar CSV' },
  { value: 'xls', label: 'Exportar XLS' },
  { value: 'xlsx', label: 'Exportar XLSX' },
  { value: 'pdf', label: 'Exportar PDF' },
];

export function UnidadesOrcamentariasActions({
  reportLoading,
  onBack,
  onAdd,
  onReport,
}: Readonly<UnidadesOrcamentariasActionsProps>) {
  return (
    <UnidadesListActions
      reportLoading={reportLoading}
      onBack={onBack}
      onAdd={onAdd}
      onReport={onReport}
      reportFormats={REPORT_FORMATS}
      addLabel='Adicionar Unidade'
      addIcon={<Plus size={16} />}
      containerClassName='flex flex-wrap items-center justify-end gap-3'
      buttonClassName={ACTION_BUTTON_CLASS}
    />
  );
}