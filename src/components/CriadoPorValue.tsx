import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { isAutoriaIndisponivel } from '@/lib/usuario-label';

type CriadoPorValueProps = Readonly<{
  /** Rótulo já formatado por `formatUsuarioLabel` / `formatUsuarioObjetoLabel`. */
  label: string;
  className?: string;
  'data-testid'?: string;
}>;

/**
 * Renderiza o valor do campo "Criado por" de forma padronizada.
 *
 * Quando a autoria não está disponível (registro histórico não migrado), o
 * componente deixa a ausência explícita — em vez de silenciar com "-" — em
 * atendimento ao critério de aceite de não ocultar a exceção conhecida.
 */
export function CriadoPorValue(props: CriadoPorValueProps) {
  const { label, className } = props;
  const indisponivel = isAutoriaIndisponivel(label);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        indisponivel && 'italic text-gray-500',
        className,
      )}
      data-testid={props['data-testid'] ?? 'criado-por-value'}
      data-autoria-indisponivel={indisponivel ? 'true' : 'false'}
      title={
        indisponivel
          ? 'Este registro foi criado antes da migração e não possui a informação de autoria na origem.'
          : undefined
      }
    >
      {indisponivel ? <Info className='size-3.5 shrink-0' aria-hidden='true' /> : null}
      {label}
    </span>
  );
}

export default CriadoPorValue;