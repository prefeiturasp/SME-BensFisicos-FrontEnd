import {
  UnidadesListActions,
  type UnidadesListReportFormatOption,
} from '@/components/UnidadesListActions';
import type { UnidadeAdministrativaExportFormat } from '../types/unidades-administrativas.types';

interface UnidadesAdministrativasActionsProps {
  canManage: boolean;
  reportLoading: boolean;
  onBack: () => void;
  onAdd: () => void;
  onReport: (format: UnidadeAdministrativaExportFormat) => void;
}

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const REPORT_FORMATS: ReadonlyArray<
  UnidadesListReportFormatOption<UnidadeAdministrativaExportFormat>
> = [
  { value: 'csv', label: 'Exportar CSV' },
  { value: 'xls', label: 'Exportar XLS' },
  { value: 'xlsx', label: 'Exportar XLSX' },
  { value: 'pdf', label: 'Exportar PDF' },
];

export function UnidadesAdministrativasActions({
  canManage,
  reportLoading,
  onBack,
  onAdd,
  onReport,
}: Readonly<UnidadesAdministrativasActionsProps>) {
  return (
    <UnidadesListActions
      canManage={canManage}
      reportLoading={reportLoading}
      onBack={onBack}
      onAdd={onAdd}
      onReport={onReport}
      reportFormats={REPORT_FORMATS}
      addLabel='Adicionar Unidade'
      buttonClassName={ACTION_BUTTON_CLASS}
    />
  );
}
