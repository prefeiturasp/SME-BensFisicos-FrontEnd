import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type ValidatedFieldProps = Readonly<{
  /** Texto do rótulo. Fica vermelho quando há erro, como o FormLabel. */
  label: ReactNode
  /** Id do controle, usado no htmlFor. */
  htmlFor?: string
  /** Mensagem de erro do campo. Ausente = campo válido. */
  error?: string | null
  /** Marca o campo como obrigatório com o asterisco. */
  required?: boolean
  className?: string
  labelClassName?: string
  children: ReactNode
}>

/**
 * Adaptador do padrão de validação inline para formulários que ainda não foram
 * migrados para react-hook-form.
 *
 * Reproduz exatamente a semântica e as classes de `FormItem` / `FormLabel` /
 * `FormMessage` (`@/components/ui/form`), que são o padrão único de referência
 * definido por Unidades Orçamentárias e Administrativas:
 * - rótulo em vermelho via `data-error`
 * - mensagem em `text-destructive` com `role="alert"`
 *
 * A borda vermelha do controle é responsabilidade do próprio controle, que deve
 * receber `aria-invalid` — `Input`, `Select` e `Textarea` já reagem a ele.
 *
 * Para formulários novos, prefira `FormField` + `FormItem` diretamente.
 */
export function ValidatedField(props: ValidatedFieldProps) {
  const {
    label,
    htmlFor,
    error,
    required = false,
    className,
    labelClassName,
    children,
  } = props

  const temErro = !!error

  return (
    <div className={cn('space-y-1', className)} data-slot='form-item'>
      <Label
        data-slot='form-label'
        data-error={temErro}
        htmlFor={htmlFor}
        className={cn(
          'text-sm font-semibold text-gray-700 data-[error=true]:text-destructive',
          labelClassName,
        )}
      >
        {label}
        {required && <span className='text-red-500'> *</span>}
      </Label>

      {children}

      {temErro && (
        <p data-slot='form-message' role='alert' className='text-destructive text-sm'>
          {error}
        </p>
      )}
    </div>
  )
}

export default ValidatedField