import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UnidadeOrcamentariaExportFormat } from '../types/unidades-orcamentarias.types';

interface UnidadesOrcamentariasActionsProps {
  reportLoading: boolean;
  onBack: () => void;
  onAdd: () => void;
  onReport: (format: UnidadeOrcamentariaExportFormat) => void;
}

const ACTION_BUTTON_CLASS =
  'h-10 px-4 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors';

const REPORT_FORMATS: Array<{ value: UnidadeOrcamentariaExportFormat; label: string }> = [
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
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reportMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!reportMenuRef.current) {
        return;
      }

      if (!reportMenuRef.current.contains(event.target as Node)) {
        setReportMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setReportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [reportMenuOpen]);

  return (
    <div className='flex flex-wrap items-center justify-end gap-3'>
      <Button type='button' onClick={onBack} className={ACTION_BUTTON_CLASS} aria-label='Voltar'>
        <ArrowLeft size={18} />
      </Button>

      <Button type='button' onClick={onAdd} className={ACTION_BUTTON_CLASS}>
        <Plus size={16} />
        Adicionar Unidade
      </Button>

      <div className='relative' ref={reportMenuRef}>
        <Button
          type='button'
          onClick={() => setReportMenuOpen((current) => !current)}
          className={ACTION_BUTTON_CLASS}
          disabled={reportLoading}
          aria-haspopup='menu'
          aria-expanded={reportMenuOpen}
          aria-label='Relatório'
        >
          <FileText size={16} />
          {reportLoading ? 'Gerando...' : 'Relatório'}
          {!reportLoading && <ChevronDown size={16} />}
        </Button>

        {reportMenuOpen && !reportLoading && (
          <div
            role='menu'
            className='absolute right-0 z-20 mt-2 min-w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg'
          >
            {REPORT_FORMATS.map((format) => (
              <button
                key={format.value}
                type='button'
                role='menuitem'
                className='flex w-full items-center rounded-sm px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100'
                onClick={() => {
                  setReportMenuOpen(false);
                  onReport(format.value);
                }}
              >
                {format.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}