import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ParametroConciliacaoStatusFilter } from '../types/parametros-conciliacao-anual.types';

interface Props {
  unidade: string;
  ano: string;
  status: ParametroConciliacaoStatusFilter;
  onUnidadeChange: (value: string) => void;
  onAnoChange: (value: string) => void;
  onStatusChange: (value: ParametroConciliacaoStatusFilter) => void;
}

const INPUT_CLASS =
  'h-10 w-full rounded-xs border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]';

export function ParametrosConciliacaoFilters({
  unidade,
  ano,
  status,
  onUnidadeChange,
  onAnoChange,
  onStatusChange,
}: Readonly<Props>) {
  return (
    <div className='grid grid-cols-1 items-center gap-5 px-3 pt-2 lg:grid-cols-3'>
      <label className='space-y-2 text-sm font-semibold text-gray-700'>
        <span>Filtrar por Unidade Orçamentária</span>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={unidade}
            onChange={(event) => onUnidadeChange(event.target.value)}
            placeholder='Digite o nome da Unidade Orçamentária'
            className={INPUT_CLASS}
          />
        </div>
      </label>

      <label className='space-y-2 text-sm font-semibold text-gray-700'>
        <span>Filtrar por Ano de referência</span>
        <input
          type='text'
          inputMode='numeric'
          maxLength={4}
          value={ano}
          onChange={(event) => onAnoChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder='Digite o ano de referência'
          className='h-10 w-full rounded-xs border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]'
        />
      </label>

      <label className='space-y-2 text-sm font-semibold text-gray-700'>
        <span>Filtrar por Status</span>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as ParametroConciliacaoStatusFilter)}
        >
          <SelectTrigger className='h-10 w-full rounded-xs border border-gray-300 bg-white px-3 text-sm text-gray-700'>
            <SelectValue placeholder='Todos' />
          </SelectTrigger>
          <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
            <SelectItem value='todos'>Todos</SelectItem>
            <SelectItem value='true'>Ativo</SelectItem>
            <SelectItem value='false'>Inativo</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
