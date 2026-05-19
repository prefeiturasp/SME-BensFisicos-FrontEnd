import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UnidadeOrcamentariaStatusFilter } from '../types/unidades-orcamentarias.types';

interface UnidadesOrcamentariasFiltersProps {
  codigo: string;
  nomeOuSigla: string;
  status: UnidadeOrcamentariaStatusFilter;
  onCodigoChange: (value: string) => void;
  onNomeOuSiglaChange: (value: string) => void;
  onStatusChange: (status: UnidadeOrcamentariaStatusFilter) => void;
}

const INPUT_CLASS =
  'h-10 w-full rounded-xs border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]';

export function UnidadesOrcamentariasFilters({
  codigo,
  nomeOuSigla,
  status,
  onCodigoChange,
  onNomeOuSiglaChange,
  onStatusChange,
}: Readonly<UnidadesOrcamentariasFiltersProps>) {
  return (
    <div className='grid grid-cols-1 items-center gap-4 lg:grid-cols-3'>
      <label className='space-y-2 text-sm font-semibold text-gray-700'>
        <span>Buscar por código</span>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={codigo}
            onChange={(event) => onCodigoChange(event.target.value)}
            placeholder='Código da UO ou do órgão'
            className={INPUT_CLASS}
          />
        </div>
      </label>

      <label className='space-y-2 text-sm font-semibold text-gray-700'>
        <span>Buscar por nome ou sigla</span>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={nomeOuSigla}
            onChange={(event) => onNomeOuSiglaChange(event.target.value)}
            placeholder='Nome ou sigla da UO ou do órgão'
            className={INPUT_CLASS}
          />
        </div>
      </label>

      <label className='space-y-2 text-sm font-semibold text-gray-700'>
        <span>Filtrar por status</span>

        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as UnidadeOrcamentariaStatusFilter)}
        >
          <SelectTrigger className='h-10 w-full rounded-xs border border-gray-300 bg-white px-3 text-sm text-gray-700'>
            <SelectValue placeholder='Todos' />
          </SelectTrigger>
          <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
            <SelectItem value='todos'>Todos</SelectItem>
            <SelectItem value='true'>Ativa</SelectItem>
            <SelectItem value='false'>Inativa</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}