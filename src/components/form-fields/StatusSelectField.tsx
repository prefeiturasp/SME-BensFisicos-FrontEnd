import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  disabled?: boolean;
  containerClassName?: string;
  triggerClassName: string;
}

export function StatusSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  disabled = false,
  containerClassName,
  triggerClassName,
}: Readonly<StatusSelectFieldProps<TFieldValues>>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const statusKey = field.value || 'status-empty';

        return (
          <FormItem className={containerClassName}>
            <div className='flex h-6 items-center'>
              <FormLabel className='text-sm font-semibold text-gray-700'>Status</FormLabel>
            </div>
            <Select
              key={statusKey}
              value={field.value as string | undefined}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger className={triggerClassName}>
                  <SelectValue placeholder='Selecione o status' />
                </SelectTrigger>
              </FormControl>
              <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
                <SelectItem value='ativa'>Ativa</SelectItem>
                <SelectItem value='inativa'>Inativa</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}