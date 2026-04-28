import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface UnidadesListReportFormatOption<T extends string> {
  value: T;
  label: string;
}

interface UnidadesListActionsProps<T extends string> {
  reportLoading: boolean;
  onBack: () => void;
  onAdd?: () => void;
  onReport: (format: T) => void;
  reportFormats: ReadonlyArray<UnidadesListReportFormatOption<T>>;
  addLabel?: string;
  addIcon?: ReactNode;
  canManage?: boolean;
  containerClassName?: string;
  buttonClassName: string;
}

export function UnidadesListActions<T extends string>({
  reportLoading,
  onBack,
  onAdd,
  onReport,
  reportFormats,
  addLabel,
  addIcon,
  canManage = true,
  containerClassName = 'flex items-center gap-3',
  buttonClassName,
}: Readonly<UnidadesListActionsProps<T>>) {
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
    <div className={containerClassName}>
      <Button type='button' onClick={onBack} className={buttonClassName} aria-label='Voltar'>
        <ArrowLeft size={18} />
      </Button>

      {canManage && onAdd && addLabel && (
        <Button type='button' onClick={onAdd} className={buttonClassName}>
          {addIcon}
          {addLabel}
        </Button>
      )}

      {canManage && (
        <div className='relative' ref={reportMenuRef}>
          <Button
            type='button'
            onClick={() => setReportMenuOpen((current) => !current)}
            className={buttonClassName}
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
              {reportFormats.map((format) => (
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
      )}
    </div>
  );
}