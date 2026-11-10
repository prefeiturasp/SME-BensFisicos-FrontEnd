import { useEffect, useMemo, useState } from 'react';
import { HistoricoTimeline } from '@/components/HistoricoTimeline';
import { formatDateTimeBR } from '@/lib/historico-datetime';
import { movimentacaoService } from '../services/movimentacao.service';
import type { MovimentacaoHistoricoGrupo } from '../types/movimentacao.types';

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

const SUFIXOS_JUSTIFICATIVA_LEGADOS = ['via API', 'via Django admin'];

function limparJustificativa(texto: string | null): string {
  if (!texto) return '';
  let resultado = texto.trimEnd();
  for (const sufixo of SUFIXOS_JUSTIFICATIVA_LEGADOS) {
    if (resultado.length <= sufixo.length) continue;
    const trecho = resultado.slice(-sufixo.length);
    if (trecho.toLowerCase() !== sufixo.toLowerCase()) continue;
    const anterior = resultado[resultado.length - sufixo.length - 1];
    if (anterior !== undefined && anterior.trim() !== '') continue;
    resultado = resultado.slice(0, -sufixo.length).trimEnd();
  }
  return resultado;
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
          error_ instanceof Error
            ? error_.message
            : 'Erro ao carregar o histórico da movimentação.';
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
        label: getGroupLabel(entry.acoes),
        details: [...new Set(entry.acoes.map((acao) => formatarAcaoHistorico(acao)))].map(
          (texto, index) => ({ key: `${texto}-${index}`, text: texto }),
        ),
      };
    });
  }, [entries]);

  return (
    <HistoricoTimeline
      ariaLabel='Histórico da movimentação'
      testIdPrefix='movimentacao-historico'
      loading={entries === null}
      error={error}
      groups={groups}
      selectedKey={selectedKey}
      onSelect={setSelectedKey}
      onClose={onClose}
    />
  );
}
