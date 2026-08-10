import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConciliacaoItemSituacao } from '../types/conciliacoes.types';
import { getSituacaoVisualConfig } from '../utils/situacao-config';

interface OcorrenciaMensagemCondicionalProps {
  situacaoAnterior: ConciliacaoItemSituacao;
  mostrar?: boolean;
}

const MENSAGEM_DIVERGENTE =
  'Este bem foi marcado como "Divergente" no inventário anterior. Selecione "Encontrado sem divergência" se a divergência foi corrigida.';

const MENSAGEM_NAO_ENCONTRADO =
  'A opção "Encontrado" está disponível pois o bem estava marcado como "Não encontrado" no inventário anterior.';

function buildMessage(situacao: ConciliacaoItemSituacao): string | null {
  if (situacao === 'divergente') return MENSAGEM_DIVERGENTE;
  if (situacao === 'nao_encontrado') return MENSAGEM_NAO_ENCONTRADO;
  return null;
}

export function OcorrenciaMensagemCondicional({
  situacaoAnterior,
  mostrar = true,
}: Readonly<OcorrenciaMensagemCondicionalProps>) {
  if (!mostrar) {
    return null;
  }

  const mensagem = buildMessage(situacaoAnterior);

  if (!mensagem) {
    return null;
  }

  const visual = getSituacaoVisualConfig(situacaoAnterior);

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-4 py-3 text-sm',
        visual.messageBorderClassName,
        visual.messageClassName,
      )}
      data-testid='ocorrencia-mensagem-condicional'
      data-situacao-anterior={situacaoAnterior}
    >
      <Info className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
      <p>{mensagem}</p>
    </div>
  );
}
