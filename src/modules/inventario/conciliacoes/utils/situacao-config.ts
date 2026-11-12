import type { ConciliacaoItemSituacao } from '../types/conciliacoes.types';
import { LAUDADO_PARA_BAIXA_BEM_STATUS } from '../types/conciliacoes.types';

export interface SituacaoVisualConfig {
  label: string;
  badgeClassName: string;
  dotClassName: string;
  messageClassName: string;
  messageBorderClassName: string;
  optionContainerClassName: string;
  optionSelectedClassName: string;
  optionHoverClassName: string;
  optionTextSelectedClassName: string;
}

export const SITUACAO_VISUAL_CONFIG: Record<ConciliacaoItemSituacao, SituacaoVisualConfig> = {
  encontrado_sem_divergencia: {
    label: 'Encontrado sem divergência',
    badgeClassName: 'bg-green-50 text-green-700 border border-green-200',
    dotClassName: 'bg-green-600',
    messageClassName: 'text-green-800',
    messageBorderClassName: 'border-green-300 bg-green-50',
    optionContainerClassName: 'border-gray-200',
    optionSelectedClassName: 'border-green-500 bg-green-50',
    optionHoverClassName: 'hover:border-green-300',
    optionTextSelectedClassName: 'text-green-800',
  },
  encontrado: {
    label: 'Encontrado',
    badgeClassName: 'bg-sky-50 text-sky-700 border border-sky-200',
    dotClassName: 'bg-sky-600',
    messageClassName: 'text-sky-800',
    messageBorderClassName: 'border-sky-300 bg-sky-50',
    optionContainerClassName: 'border-gray-200',
    optionSelectedClassName: 'border-sky-500 bg-sky-50',
    optionHoverClassName: 'hover:border-sky-300',
    optionTextSelectedClassName: 'text-sky-800',
  },
  nao_encontrado: {
    label: 'Não encontrado',
    badgeClassName: 'bg-red-50 text-red-700 border border-red-200',
    dotClassName: 'bg-red-600',
    messageClassName: 'text-sky-800',
    messageBorderClassName: 'border-sky-300 bg-sky-50',
    optionContainerClassName: 'border-gray-200',
    optionSelectedClassName: 'border-red-500 bg-red-50',
    optionHoverClassName: 'hover:border-red-300',
    optionTextSelectedClassName: 'text-red-800',
  },
  divergente: {
    label: 'Divergente',
    badgeClassName: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClassName: 'bg-amber-500',
    messageClassName: 'text-amber-800',
    messageBorderClassName: 'border-amber-300 bg-amber-50',
    optionContainerClassName: 'border-gray-200',
    optionSelectedClassName: 'border-amber-500 bg-amber-50',
    optionHoverClassName: 'hover:border-amber-300',
    optionTextSelectedClassName: 'text-amber-800',
  },
  em_processo_de_baixa_fisica: {
    label: 'Em processo de baixa',
    badgeClassName: 'bg-violet-50 text-violet-700 border border-violet-200',
    dotClassName: 'bg-violet-600',
    messageClassName: 'text-violet-800',
    messageBorderClassName: 'border-violet-300 bg-violet-50',
    optionContainerClassName: 'border-gray-200',
    optionSelectedClassName: 'border-violet-500 bg-violet-50',
    optionHoverClassName: 'hover:border-violet-300',
    optionTextSelectedClassName: 'text-violet-800',
  },
  baixa_fisica: {
    label: 'Baixa Física',
    badgeClassName: 'bg-gray-100 text-gray-700 border border-gray-300',
    dotClassName: 'bg-gray-400',
    messageClassName: 'text-gray-800',
    messageBorderClassName: 'border-gray-300 bg-gray-50',
    optionContainerClassName: 'border-gray-200',
    optionSelectedClassName: 'border-gray-500 bg-gray-50',
    optionHoverClassName: 'hover:border-gray-300',
    optionTextSelectedClassName: 'text-gray-800',
  },
};

export const LAUDADO_PARA_BAIXA_LABEL = 'Laudado para Baixa';

export const LAUDADO_PARA_BAIXA_VISUAL_CONFIG: SituacaoVisualConfig = {
  label: LAUDADO_PARA_BAIXA_LABEL,
  badgeClassName: 'bg-orange-50 text-orange-700 border border-orange-200',
  dotClassName: 'bg-orange-500',
  messageClassName: 'text-orange-800',
  messageBorderClassName: 'border-orange-300 bg-orange-50',
  optionContainerClassName: 'border-gray-200',
  optionSelectedClassName: 'border-orange-500 bg-orange-50',
  optionHoverClassName: 'hover:border-orange-300',
  optionTextSelectedClassName: 'text-orange-800',
};

export function getSituacaoVisualConfig(situacao: ConciliacaoItemSituacao): SituacaoVisualConfig {
  return SITUACAO_VISUAL_CONFIG[situacao];
}

export function isBemLaudadoParaBaixa(status: string | null | undefined): boolean {
  return status === LAUDADO_PARA_BAIXA_BEM_STATUS;
}

export function deveExibirSeloLaudado(
  situacao: ConciliacaoItemSituacao | string | null | undefined,
  bemStatus: string | null | undefined,
  conciliacaoAberta?: boolean,
): boolean {
  if (conciliacaoAberta !== true) return false;
  return situacao === 'em_processo_de_baixa_fisica' && isBemLaudadoParaBaixa(bemStatus);
}
