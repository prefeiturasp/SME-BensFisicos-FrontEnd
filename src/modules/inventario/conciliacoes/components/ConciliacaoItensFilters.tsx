import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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

function SituacaoMultiSelect({
  value,
  onChange,
}: Readonly<{
  value: ConciliacaoItemSituacaoFilter;
  onChange: (value: ConciliacaoItemSituacaoFilter) => void;
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = useMemo(() => {
    if (value.length === 0) return 'Todas';

    const labels = value
      .map((situacao) => SITUACAO_LABELS[situacao as ConciliacaoItemSituacao])
      .filter(Boolean);

    return labels.length > 0 ? labels.join(', ') : 'Todas';
  }, [value]);

  const toggleSituacao = (situacao: string) => {
    onChange(
      value.includes(situacao as ConciliacaoItemSituacao)
        ? value.filter((item) => item !== situacao)
        : [...value, situacao as ConciliacaoItemSituacao],
    );
  };

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className={SELECT_TRIGGER_CLASS}
        aria-haspopup='listbox'
        aria-expanded={open}
        data-testid='conciliacao-itens-situacao-select'
      >
        <span className='flex w-full items-center justify-between gap-2'>
          <span className='truncate text-left'>{selectedLabel}</span>
          <ChevronDown className='size-4 shrink-0 text-gray-500' />
        </span>
      </button>

      {open && (
        <div className='absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-xl'>
          <div className='p-1'>
            {SITUACAO_ORDER.map((situacao) => {
              const checked = value.includes(situacao);

              return (
                <label
                  key={situacao}
                  className='flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm font-normal text-gray-700 hover:bg-gray-50'
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleSituacao(situacao)}
                  />
                  <span>{SITUACAO_LABELS[situacao]}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
        <SituacaoMultiSelect value={situacao} onChange={onSituacaoChange} />
      </label>
    </div>
  );
}
