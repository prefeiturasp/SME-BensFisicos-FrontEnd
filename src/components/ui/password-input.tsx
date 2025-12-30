import * as React from 'react';
import { Input } from './input';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  showToggle?: boolean;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showToggle = true, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className='relative'>
        {/* Spread props first so our computed `type` overrides any incoming `type` prop */}
        <Input
          ref={ref}
          {...props}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
        />

        {showToggle && (
          <button
            type='button'
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className='absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center p-1 text-gray-600'
          >
            {/* Show closed-eye when hidden, open-eye when visible */}
            {visible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
