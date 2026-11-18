/**
 * Formatação de data e hora usada nas linhas do tempo de histórico
 * (conciliações, movimentações). Extração sem mudança de comportamento:
 * o mesmo `Intl.DateTimeFormat` que cada modal definia localmente.
 */

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTimeBR(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: '-', time: '-' };
  }
  return { date: DATE_FORMATTER.format(d), time: TIME_FORMATTER.format(d) };
}

export function getHistoricoInitial(name: string | null): string {
  return (name?.trim() ?? '?').charAt(0).toUpperCase();
}
