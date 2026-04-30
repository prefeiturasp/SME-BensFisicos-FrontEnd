import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface UppercaseTextFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  disabled?: boolean;
  id?: string;
  inputClassName: string;
}

export function UppercaseTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled = false,
  id,
  inputClassName,
}: Readonly<UppercaseTextFieldProps<TFieldValues>>) {
  const labelProps = id ? { htmlFor: id } : {};
  const inputProps = id ? { id } : {};

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className='flex h-6 items-center'>
            <FormLabel className='text-sm font-semibold text-gray-700' {...labelProps}>
              {label}
            </FormLabel>
          </div>
          <FormControl>
            <Input
              {...inputProps}
              placeholder={placeholder}
              className={inputClassName}
              disabled={disabled}
              value={(field.value as string | undefined) ?? ''}
              onChange={(event) => field.onChange(event.target.value.toUpperCase())}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}