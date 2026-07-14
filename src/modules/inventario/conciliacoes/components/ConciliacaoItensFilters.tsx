import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ConciliacaoItemSituacao,
  ConciliacaoItemSituacaoFilter,
} from '../types/conciliacoes.types';

interface Props {
  numeroPatrimonial: string;
  nome: string;
  situacao: ConciliacaoItemSituacaoFilter;
  onNumeroPatrimonialChange: (value: string) => void;
  onNomeChange: (value: string) => void;
  onSituacaoChange: (value: ConciliacaoItemSituacaoFilter) => void;
}

const NUMERO_PATRIMONIAL_PLACEHOLDER = 'Digite o Número Patrimonial';
const NOME_PLACEHOLDER = 'Digite o Nome do bem';

const INPUT_CLASS =
  'h-10 w-full rounded-xs border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]';

const LABEL_CLASS = 'space-y-2 text-sm font-semibold text-gray-700';

const SELECT_TRIGGER_CLASS =
  '!h-10 !py-0 w-full rounded-xs border border-gray-300 bg-white px-3 text-sm text-gray-700';

const SITUACAO_LABELS: Record<ConciliacaoItemSituacao, string> = {
  encontrado_sem_divergencia: 'Encontrado sem divergência',
  encontrado: 'Encontrado',
  nao_encontrado: 'Não encontrado',
  divergente: 'Divergente',
  em_processo_de_baixa_fisica: 'Em processo de baixa',
  baixa_fisica: 'Baixa Física',
};

const SITUACAO_ORDER: ReadonlyArray<ConciliacaoItemSituacao> = [
  'encontrado_sem_divergencia',
  'encontrado',
  'nao_encontrado',
  'divergente',
  'em_processo_de_baixa_fisica',
  'baixa_fisica',
];

export function ConciliacaoItensFilters({
  numeroPatrimonial,
  nome,
  situacao,
  onNumeroPatrimonialChange,
  onNomeChange,
  onSituacaoChange,
}: Readonly<Props>) {
  return (
    <div className='grid grid-cols-1 gap-5 lg:grid-cols-3 mb-10'>
      <label className={LABEL_CLASS}>
        <span>Filtrar por Número Patrimonial</span>
        <div className='relative w-full'>
          <Search
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={16}
          />
          <input
            type='text'
            value={numeroPatrimonial}
            onChange={(event) => onNumeroPatrimonialChange(event.target.value)}
            placeholder={NUMERO_PATRIMONIAL_PLACEHOLDER}
            className={INPUT_CLASS}
            data-testid='conciliacao-itens-numero-input'
          />
        </div>
      </label>

      <label className={LABEL_CLASS}>
        <span>Filtrar por Nome do bem</span>
        <div className='relative w-full'>
          <Search
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={16}
          />
          <input
            type='text'
            value={nome}
            onChange={(event) => onNomeChange(event.target.value)}
            placeholder={NOME_PLACEHOLDER}
            className={INPUT_CLASS}
            data-testid='conciliacao-itens-nome-input'
          />
        </div>
      </label>

      <label className={LABEL_CLASS}>
        <span>Filtrar por Situação</span>
        <Select
          value={situacao}
          onValueChange={(value) =>
            onSituacaoChange(value as ConciliacaoItemSituacaoFilter)
          }
        >
          <SelectTrigger
            className={SELECT_TRIGGER_CLASS}
            data-testid='conciliacao-itens-situacao-select'
          >
            <SelectValue placeholder='Todas' />
          </SelectTrigger>
          <SelectContent
            position='popper'
            className='w-(--radix-select-trigger-width)'
          >
            <SelectItem value='todos'>Todas</SelectItem>
            {SITUACAO_ORDER.map((value) => (
              <SelectItem key={value} value={value}>
                {SITUACAO_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
