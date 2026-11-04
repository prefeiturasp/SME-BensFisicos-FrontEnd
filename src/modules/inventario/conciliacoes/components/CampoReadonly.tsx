import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const READONLY_INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 bg-[#F5F5F5] px-4 text-sm text-gray-700 disabled:opacity-100 placeholder:text-gray-400';

interface CampoReadonlyProps {
  id?: string;
  label: string;
  value: string;
  placeholder?: string;
  className?: string;
}

export function CampoReadonly({
  id,
  label,
  value,
  placeholder = 'Não disponível',
  className,
}: Readonly<CampoReadonlyProps>) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className='flex h-6 items-center'>
        <label htmlFor={id} className='text-sm font-semibold text-gray-700'>
          {label}
        </label>
      </div>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled
        readOnly
        className={READONLY_INPUT_CLASS}
      />
    </div>
  );
}
