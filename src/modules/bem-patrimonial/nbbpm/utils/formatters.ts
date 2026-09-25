const PLACEHOLDER = '-';
const DATA_PURA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Formata data pura do backend (`YYYY-MM-DD`) como `dd/MM/yyyy`.
 *
 * Não passa por `new Date()`: uma data pura é interpretada como UTC e, no
 * fuso de São Paulo, apareceria um dia antes.
 */
export function formatDataBR(value: string | null | undefined): string {
  if (!value) return PLACEHOLDER;

  const match = DATA_PURA.exec(value);
  if (!match) return PLACEHOLDER;

  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}

/** Formata data/hora ISO no horário local, como `dd/MM/yyyy - HH:mm` (padrão de Baixas). */
export function formatDataHoraBR(value: string | null | undefined): string {
  if (!value) return PLACEHOLDER;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return PLACEHOLDER;

  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${ano} - ${horas}:${minutos}`;
}

/** Identificação da Baixa Física no padrão da tela de detalhe: `#003`. */
export function formatBaixaRef(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}
