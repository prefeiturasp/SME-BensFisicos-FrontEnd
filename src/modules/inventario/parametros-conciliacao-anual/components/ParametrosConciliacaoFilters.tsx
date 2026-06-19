import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ParametroConciliacaoStatusFilter } from '../types/parametros-conciliacao-anual.types';

interface Props {
  ano: string;
  status: ParametroConciliacaoStatusFilter;
  onAnoChange: (value: string) => void;
  onStatusChange: (value: ParametroConciliacaoStatusFilter) => void;
}

export function ParametrosConciliacaoFilters({
  ano,
  status,
  onAnoChange,
  onStatusChange,
}: Readonly<Props>) {
  return (
    <div className='grid grid-cols-1 items-center gap-5 px-3 pt-2 lg:grid-cols-2'>
      <label className='space-y-2 text-sm font-semibold text-gray-700'>
        <span>Filtrar por Ano de referência</span>
        <input
          type='text'
          inputMode='numeric'
          maxLength={4}
          value={ano}
          onChange={(event) => onAnoChange(event.target.value.replaceAll(/\D/g, '').slice(0, 4))}
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
