import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { isAutoriaAutomatica, isAutoriaIndisponivel } from '@/lib/usuario-label';

type CriadoPorValueProps = Readonly<{
  /** Rótulo já formatado pelos helpers de `@/lib/usuario-label`. */
  label: string;
  className?: string;
  'data-testid'?: string;
}>;

/**
 * Renderiza o valor do campo "Criado por" de forma padronizada.
 *
 * Quando não há autoria, a ausência fica explícita — nunca é silenciada com
 * "-" ou string vazia. O texto em si não atribui causa: quem decide o rótulo é
 * o helper do módulo, porque o significado do vazio varia conforme as regras do
 * backend (ver `@/lib/usuario-label`).
 */
export function CriadoPorValue(props: CriadoPorValueProps) {
  const { label, className } = props;
  const indisponivel = isAutoriaIndisponivel(label);
  const automatica = isAutoriaAutomatica(label);

  let titulo: string | undefined;
  if (automatica) {
    titulo = 'Registro gerado pela rotina automática do sistema, sem usuário responsável.';
  } else if (indisponivel) {
    titulo = 'Este registro não possui a informação de autoria na origem.';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        indisponivel && 'italic text-gray-500',
        className,
      )}
      data-testid={props['data-testid'] ?? 'criado-por-value'}
      data-autoria-indisponivel={indisponivel ? 'true' : 'false'}
      data-autoria-automatica={automatica ? 'true' : 'false'}
      title={titulo}
    >
      {indisponivel ? <Info className='size-3.5 shrink-0' aria-hidden='true' /> : null}
      {label}
    </span>
  );
}

export default CriadoPorValue;
