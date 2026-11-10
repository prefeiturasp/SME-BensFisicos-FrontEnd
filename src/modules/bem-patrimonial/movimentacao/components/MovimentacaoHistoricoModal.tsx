import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { movimentacaoService } from '../services/movimentacao.service';
import type { MovimentacaoHistoricoGrupo } from '../types/movimentacao.types';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTimeBR(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: '-', time: '-' };
  }
  return { date: DATE_FORMATTER.format(d), time: TIME_FORMATTER.format(d) };
}

function getInitial(name: string | null): string {
  return (name?.trim() ?? '?').charAt(0).toUpperCase();
}

function getGroupLabel(acoes: MovimentacaoHistoricoGrupo['acoes']): string {
  if (acoes.some((a) => a.campo === 'status' && a.valor_novo === 'Aceita'))
    return 'Movimentação aprovada';
  if (acoes.some((a) => a.campo === 'status' && a.valor_novo === 'Rejeitada'))
    return 'Movimentação rejeitada';
  if (acoes.some((a) => a.campo === 'status' && a.valor_novo === 'Cancelada'))
    return 'Movimentação cancelada';
  if (acoes.some((a) => a.campo === 'status' && a.valor_novo === 'Enviada'))
    return 'Movimentação criada';
  const texto = acoes
    .map((a) => a.justificativa ?? '')
    .join(' ')
    .toLowerCase();
  if (texto.includes('aprovada')) return 'Movimentação aprovada';
  if (texto.includes('rejeitada')) return 'Movimentação rejeitada';
  if (texto.includes('cancelada')) return 'Movimentação cancelada';
  if (texto.includes('criada')) return 'Movimentação criada';
  return 'Movimentação alterada';
}

const CAMPO_LABELS: Record<string, string> = {
  status: 'Situação',
  aprovado_por: 'Aprovado por',
  rejeitado_por: 'Rejeitado por',
  cancelado_por: 'Cancelado por',
  unidade_administrativa_origem: 'Unidade de origem',
  unidade_administrativa_destino: 'Unidade de destino',
  observacao: 'Observação',
};

function formatAcao(campo: string, valorAntigo: string | null, valorNovo: string | null): string {
  const antigo = valorAntigo?.trim() || 'vazio';
  const novo = valorNovo?.trim() || 'vazio';
  const rotulo = CAMPO_LABELS[campo] ?? `Campo "${campo}"`;
  return `${rotulo}: ${antigo} → ${novo}`;
}

function limparJustificativa(texto: string | null): string {
  if (!texto) return '';
  return texto.replace(/\s+via\s+(API|Django admin)\s*$/i, '').trim();
}

function formatarAcaoHistorico(acao: MovimentacaoHistoricoGrupo['acoes'][number]): string {
  const justificativa = limparJustificativa(acao.justificativa);
  const bem = acao.valor_novo?.trim() || acao.valor_antigo?.trim() || '';
  if (acao.campo === 'itens') {
    if (bem) return justificativa ? `${justificativa}: ${bem}` : `Bem: ${bem}`;
    return justificativa || formatAcao(acao.campo, acao.valor_antigo, acao.valor_novo);
  }
  return justificativa || formatAcao(acao.campo, acao.valor_antigo, acao.valor_novo);
}

interface MovimentacaoHistoricoModalProps {
  readonly movimentacaoId: number;
  readonly onClose: () => void;
}

export function MovimentacaoHistoricoModal({
  movimentacaoId,
  onClose,
}: Readonly<MovimentacaoHistoricoModalProps>) {
  const [entries, setEntries] = useState<MovimentacaoHistoricoGrupo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await movimentacaoService.historico(movimentacaoId);
        if (cancelled) return;
        setEntries(data);
      } catch (error_) {
        if (cancelled) return;
        const message =
          error_ instanceof Error ? error_.message : 'Erro ao carregar o histórico da movimentação.';
        setError(message);
        setEntries([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [movimentacaoId]);

  const groups = useMemo(() => {
    if (!entries) return [];
    return entries.map((entry, idx) => {
      const { date, time } = formatDateTimeBR(entry.alterado_em);
      return {
        key: `${entry.alterado_em}__${entry.alterado_por ?? '?'}__${idx}`,
        user: entry.alterado_por_nome,
        date,
        time,
        acoes: entry.acoes,
      };
    });
  }, [entries]);

  const effectiveSelectedKey = selectedKey ?? groups[0]?.key ?? null;
  const selectedGroup = groups.find((g) => g.key === effectiveSelectedKey) ?? groups[0];
  const acoesExibidas = selectedGroup
    ? [...new Set(selectedGroup.acoes.map((acao) => formatarAcaoHistorico(acao)))]
    : [];

  return (
    <dialog
      open
      className='fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-black/40 p-0'
      aria-label='Histórico da movimentação'
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div
        className='mx-4 w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl'
        data-testid='movimentacao-historico-modal'
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

        {entries === null && (
          <div className='p-8 text-center text-sm text-gray-400' data-testid='movimentacao-historico-loading'>
            Carregando...
          </div>
        )}

        {entries !== null && error && (
          <div className='p-8 text-center text-sm text-red-600' role='alert' data-testid='movimentacao-historico-error'>
            {error}
          </div>
        )}

        {entries !== null && !error && groups.length === 0 && (
          <div className='p-8 text-center text-sm text-gray-400' data-testid='movimentacao-historico-empty'>
            Nenhum histórico encontrado.
          </div>
        )}

        {entries !== null && !error && groups.length > 0 && (
          <div className='flex min-h-[400px] max-h-[70vh] divide-x divide-gray-200'>
            <div className='w-[40%] space-y-2 overflow-y-auto px-4 py-4'>
              <p className='mb-3 px-2 text-sm font-semibold text-gray-500'>Usuário</p>
              {groups.map((group) => {
                const isSelected = group.key === effectiveSelectedKey;
                const label = getGroupLabel(group.acoes);
                const selectedCls = isSelected ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-100';
                const dateCls = isSelected ? 'text-gray-300' : 'text-gray-400';
                return (
                  <button
                    key={group.key}
                    type='button'
                    onClick={() => setSelectedKey(group.key)}
                    className={`flex w-full items-start gap-3 rounded-md px-4 py-3 text-left transition-colors ${selectedCls}`}
                  >
                    <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F7D57] text-sm font-bold text-white'>
                      {getInitial(group.user)}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold leading-tight'>{label}</p>
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
                      {getInitial(selectedGroup.user)}
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
                    {acoesExibidas.map((texto, index) => (
                      <p key={`${texto}-${index}`} className='text-sm text-gray-600'>
                        {texto}
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
