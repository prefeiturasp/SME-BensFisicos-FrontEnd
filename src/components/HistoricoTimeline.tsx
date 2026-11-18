import { X } from 'lucide-react';
import { getHistoricoInitial } from '@/lib/historico-datetime';

export interface HistoricoTimelineDetail {
  key: string;
  text: string;
}

export interface HistoricoTimelineGroup {
  key: string;
  user: string | null;
  date: string;
  time: string;
  label: string;
  details: HistoricoTimelineDetail[];
}

interface HistoricoTimelineProps {
  readonly ariaLabel: string;
  readonly testIdPrefix: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly groups: HistoricoTimelineGroup[];
  readonly selectedKey: string | null;
  readonly onSelect: (key: string) => void;
  readonly onClose: () => void;
}

export function HistoricoTimeline({
  ariaLabel,
  testIdPrefix,
  loading,
  error,
  groups,
  selectedKey,
  onSelect,
  onClose,
}: Readonly<HistoricoTimelineProps>) {
  const selectedGroup = groups.find((g) => g.key === selectedKey) ?? groups[0];

  return (
    <dialog
      open
      className='fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-black/40 p-0'
      aria-label={ariaLabel}
      onClose={onClose}
    >
      <div
        className='mx-4 w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl'
        data-testid={`${testIdPrefix}-modal`}
      >
        <div className='flex items-center justify-between border-b border-gray-200 px-8 py-6'>
          <h2 className='text-2xl font-bold text-gray-800'>Histórico</h2>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 transition-colors hover:text-gray-600 cursor-pointer'
            aria-label='Fechar histórico'
          >
            <X size={22} />
          </button>
        </div>

        {loading && (
          <div
            className='p-8 text-center text-sm text-gray-400'
            data-testid={`${testIdPrefix}-loading`}
          >
            Carregando...
          </div>
        )}

        {!loading && error && (
          <div
            className='p-8 text-center text-sm text-red-600'
            role='alert'
            data-testid={`${testIdPrefix}-error`}
          >
            {error}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div
            className='p-8 text-center text-sm text-gray-400'
            data-testid={`${testIdPrefix}-empty`}
          >
            Nenhum histórico encontrado.
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className='flex min-h-[400px] max-h-[70vh] divide-x divide-gray-200'>
            <div className='w-[40%] space-y-2 overflow-y-auto px-4 py-4'>
              <p className='mb-3 px-2 text-sm font-semibold text-gray-500'>Usuário</p>
              {groups.map((group) => {
                const isSelected = group.key === selectedGroup?.key;
                const selectedCls = isSelected
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100';
                const dateCls = isSelected ? 'text-gray-300' : 'text-gray-400';
                return (
                  <button
                    key={group.key}
                    type='button'
                    onClick={() => onSelect(group.key)}
                    className={`flex w-full items-start gap-3 rounded-md px-4 py-3 text-left transition-colors ${selectedCls}`}
                  >
                    <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F7D57] text-sm font-bold text-white'>
                      {getHistoricoInitial(group.user)}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold leading-tight'>{group.label}</p>
                      <p className={`mt-0.5 text-xs ${dateCls}`}>Usuário: {group.user ?? '-'}</p>
                    </div>
                    <div className={`shrink-0 text-right text-xs ${dateCls}`}>
                      <p>{group.date}</p>
                      <p>{group.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <p className='mb-4 text-sm font-semibold text-gray-500'>Ações</p>
              {selectedGroup && (
                <div className='overflow-hidden rounded-lg border border-gray-200'>
                  <div className='flex items-start gap-3 border-b border-gray-200 px-4 py-3'>
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F7D57] text-sm font-bold text-white'>
                      {getHistoricoInitial(selectedGroup.user)}
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm text-gray-700'>Usuário: {selectedGroup.user ?? '-'}</p>
                    </div>
                    <div className='text-right text-xs text-gray-400'>
                      <p>Data: {selectedGroup.date}</p>
                      <p>{selectedGroup.time}</p>
                    </div>
                  </div>
                  <div className='space-y-2 px-4 py-4'>
                    <p className='mb-2 text-sm font-semibold text-gray-700'>Ações:</p>
                    {selectedGroup.details.map((detail) => (
                      <p key={detail.key} className='text-sm text-gray-600'>
                        {detail.text}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
