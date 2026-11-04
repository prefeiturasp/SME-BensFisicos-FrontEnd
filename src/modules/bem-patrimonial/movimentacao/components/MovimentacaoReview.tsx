import { ResumoBensMovimentacao, type SelecaoMovimentacao } from './MovimentacaoBensSelection';

export function MovimentacaoReview({
  origem,
  uoDestino,
  uaDestino,
  observacao,
  selecoes,
}: Readonly<{
  origem: string | undefined;
  uoDestino: string | undefined;
  uaDestino: string | undefined;
  observacao: string | undefined;
  selecoes: SelecaoMovimentacao[];
}>) {
  return (
    <div className='space-y-5'>
      <dl className='grid gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2'>
        <div>
          <dt className='text-sm font-semibold'>Origem</dt>
          <dd className='text-sm'>{origem}</dd>
        </div>
        <div>
          <dt className='text-sm font-semibold'>Destino</dt>
          <dd className='text-sm'>
            <p>{uoDestino}</p>
            <p>{uaDestino}</p>
          </dd>
        </div>
        <div className='sm:col-span-2'>
          <dt className='text-sm font-semibold'>Observação</dt>
          <dd className='whitespace-pre-wrap break-words text-sm'>
            {observacao || 'Não informada'}
          </dd>
        </div>
      </dl>
      <ResumoBensMovimentacao selecoes={selecoes} />
    </div>
  );
}
