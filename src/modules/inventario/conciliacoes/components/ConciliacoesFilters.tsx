import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ConciliacaoStatusFilter, ConciliacaoTipoFilter } from '../types/conciliacoes.types';

interface Props {
  search: string;
  anoVigencia: string;
  tipo: ConciliacaoTipoFilter;
  status: ConciliacaoStatusFilter;
  onSearchChange: (value: string) => void;
  onAnoVigenciaChange: (value: string) => void;
  onTipoChange: (value: ConciliacaoTipoFilter) => void;
  onStatusChange: (value: ConciliacaoStatusFilter) => void;
}

const SEARCH_PLACEHOLDER = 'Digite o número ou a unidade administrativa';
const ANO_MIN = 2025;

const TIPO_LABELS: Record<ConciliacaoTipoFilter, string> = {
  todos: 'Todos',
  anual: 'Anual',
  eventual: 'Eventual',
};

const STATUS_LABELS: Record<ConciliacaoStatusFilter, string> = {
  todos: 'Todos',
  em_aberto: 'Aberta',
  fechado: 'Fechada',
  fechado_admin: 'Fechada pelo administrador - Não Conciliado',
};

const SEARCH_INPUT_CLASS =
  'h-10 w-full rounded-xs border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]';

const LABEL_CLASS = 'space-y-2 text-sm font-semibold text-gray-700';

const SELECT_TRIGGER_CLASS =
  '!h-10 !py-0 w-full rounded-xs border border-gray-300 bg-white px-3 text-sm text-gray-700';

function buildAnoOptions() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= ANO_MIN; year -= 1) {
    years.push(year);
  }
  return years;
}

const ANO_OPTIONS = buildAnoOptions();

export function ConciliacoesFilters({
  search,
  anoVigencia,
  tipo,
  status,
  onSearchChange,
  onAnoVigenciaChange,
  onTipoChange,
  onStatusChange,
}: Readonly<Props>) {
  return (
    <div className='grid grid-cols-1 gap-5 px-3 pt-2 lg:grid-cols-4'>
      <label className={LABEL_CLASS}>
        <span>Buscar Conciliação</span>
        <div className='relative w-full'>
          <Search
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={16}
          />
          <input
            type='text'
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            className={SEARCH_INPUT_CLASS}
            data-testid='conciliacoes-search-input'
          />
        </div>
      </label>

      <label className={LABEL_CLASS}>
        <span>Filtrar por Ano de Vigência</span>
        <Select
          value={anoVigencia || 'todos'}
          onValueChange={(value) => onAnoVigenciaChange(value === 'todos' ? '' : value)}
        >
          <SelectTrigger className={SELECT_TRIGGER_CLASS} data-testid='conciliacoes-ano-select'>
            <SelectValue placeholder='Todos' />
          </SelectTrigger>
          <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
            <SelectItem value='todos'>Todos</SelectItem>
            {ANO_OPTIONS.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className={LABEL_CLASS}>
        <span>Filtrar por Tipo</span>
        <Select
          value={tipo}
          onValueChange={(value) => onTipoChange(value as ConciliacaoTipoFilter)}
        >
          <SelectTrigger className={SELECT_TRIGGER_CLASS} data-testid='conciliacoes-tipo-select'>
            <SelectValue placeholder='Todos' />
          </SelectTrigger>
          <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
            {(Object.keys(TIPO_LABELS) as ConciliacaoTipoFilter[]).map((value) => (
              <SelectItem key={value} value={value}>
                {TIPO_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className={LABEL_CLASS}>
        <span>Filtrar por Status</span>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as ConciliacaoStatusFilter)}
        >
          <SelectTrigger className={SELECT_TRIGGER_CLASS} data-testid='conciliacoes-status-select'>
            <SelectValue placeholder='Todos' />
          </SelectTrigger>
          <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
            {(Object.keys(STATUS_LABELS) as ConciliacaoStatusFilter[]).map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
