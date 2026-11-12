import { useEffect, useMemo, useState } from 'react';
import { HistoricoTimeline } from '@/components/HistoricoTimeline';
import { formatDateTimeBR } from '@/lib/historico-datetime';
import { conciliacoesService } from '../services/conciliacoes.service';
import type {
  ConciliacaoHistoricoAcao,
  ConciliacaoHistoricoGrupo,
} from '../types/conciliacoes.types';

function getGroupKey(entry: ConciliacaoHistoricoGrupo, date: string, time: string) {
  return `${entry.alterado_por ?? '?'}__${date}__${time}`;
}

function getGroupLabel(items: ConciliacaoHistoricoGrupo['acoes']): string {
  if (items.some((i) => i.campo === 'acao' && i.valor_novo === 'criado')) {
    return 'Conciliação criada';
  }
  if (items.some((i) => i.campo === 'status' && i.valor_novo === 'Fechada')) {
    return 'Conciliação finalizada';
  }
  if (items.some((i) => i.campo === 'fechado_por')) {
    return 'Conciliação finalizada';
  }
  return 'Conciliação alterada';
}

function formatAcao(acao: ConciliacaoHistoricoAcao): string {
  const justificativa = limparJustificativa(acao.justificativa);
  if (justificativa) {
    return justificativa;
  }

  const antigo = acao.valor_antigo?.trim() || 'vazio';
  const novo = acao.valor_novo?.trim() || 'vazio';
  return `Campo "${acao.campo}": ${antigo} → ${novo}`;
}

const SUFIXOS_JUSTIFICATIVA_LEGADOS = ['via API', 'via Django admin'];

function limparJustificativa(texto: string | null | undefined): string {
  if (!texto) return '';
  let resultado = texto.trimEnd();
  while (true) {
    let removido = false;
    for (const sufixo of SUFIXOS_JUSTIFICATIVA_LEGADOS) {
      if (resultado.length <= sufixo.length) continue;
      const trecho = resultado.slice(-sufixo.length);
      if (trecho.toLowerCase() !== sufixo.toLowerCase()) continue;
      const anterior = resultado[resultado.length - sufixo.length - 1];
      if (anterior !== undefined && anterior.trim() !== '') continue;
      resultado = resultado.slice(0, -sufixo.length).trimEnd();
      removido = true;
    }
    if (!removido) break;
  }
  return resultado;
}

interface ConciliacaoHistoricoModalProps {
  readonly conciliacaoId: number;
  readonly onClose: () => void;
}

export function ConciliacaoHistoricoModal({
  conciliacaoId,
  onClose,
}: Readonly<ConciliacaoHistoricoModalProps>) {
  const [entries, setEntries] = useState<ConciliacaoHistoricoGrupo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await conciliacoesService.historico(conciliacaoId);
        if (cancelled) return;
        setEntries(data);
      } catch (error_) {
        if (cancelled) return;
        const message =
          error_ instanceof Error ? error_.message : 'Erro ao carregar o histórico da conciliação.';
        setError(message);
        setEntries([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [conciliacaoId]);

  const groups = useMemo(() => {
    if (!entries) return [];
    return entries.map((entry) => {
      const { date, time } = formatDateTimeBR(entry.alterado_em);
      return {
        key: getGroupKey(entry, date, time),
        user: entry.alterado_por_nome,
        date,
        time,
        label: getGroupLabel(entry.acoes),
        details: entry.acoes.map((acao, index) => ({
          key: `${acao.campo}-${index}`,
          text: formatAcao(acao),
        })),
      };
    });
  }, [entries]);

  return (
    <HistoricoTimeline
      ariaLabel='Histórico da conciliação'
      testIdPrefix='conciliacao-historico'
      loading={entries === null}
      error={error}
      groups={groups}
      selectedKey={selectedKey}
      onSelect={setSelectedKey}
      onClose={onClose}
    />
  );
}
