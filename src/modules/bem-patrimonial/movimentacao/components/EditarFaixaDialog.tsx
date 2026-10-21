import { useEffect, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { NumeroPatrimonialAutocomplete } from './NumeroPatrimonialAutocomplete';
import type { MovimentacaoBemBusca } from '../types/movimentacao.types';
import type { SelecaoMovimentacao } from './MovimentacaoBensSelection';
import { AJUDAS_MOVIMENTACAO, MovimentacaoHelp } from './MovimentacaoHelp';

type Faixa = Extract<SelecaoMovimentacao, { tipo: 'faixa' }>;

export function EditarFaixaDialog({
  faixa,
  unidadeAdministrativaId,
  onValidar,
  onAplicar,
  onClose,
}: Readonly<{
  faixa: Faixa;
  unidadeAdministrativaId: number | null;
  onValidar: (de: string, ate: string) => Promise<MovimentacaoBemBusca[]>;
  onAplicar: (de: string, ate: string) => Promise<void>;
  onClose: () => void;
}>) {
  const [de, setDe] = useState(faixa.numeroDe);
  const [ate, setAte] = useState(faixa.numeroAte);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const enviando = useRef(false);
  const [previa, setPrevia] = useState<MovimentacaoBemBusca[] | null>(faixa.bens);
  const [erroPrevia, setErroPrevia] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setPrevia(null);
    setErroPrevia(null);
    setAtualizando(true);
    const timer = setTimeout(() => {
      void onValidar(de, ate)
        .then((bens) => {
          if (ativo) setPrevia(bens);
        })
        .catch((error: unknown) => {
          if (ativo)
            setErroPrevia(
              error instanceof Error ? error.message : 'Não foi possível atualizar a prévia.',
            );
        })
        .finally(() => {
          if (ativo) setAtualizando(false);
        });
    }, 350);
    if (de === faixa.numeroDe && ate === faixa.numeroAte) {
      clearTimeout(timer);
      setPrevia(faixa.bens);
      setAtualizando(false);
    }
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [de, ate, faixa, onValidar]);

  const idsAtuais = new Set(faixa.bens.map((bem) => bem.id));
  const idsPrevios = new Set(previa?.map((bem) => bem.id));
  const linhas =
    previa === null
      ? faixa.bens
      : [...previa, ...faixa.bens.filter((bem) => !idsPrevios.has(bem.id))];
  const tituloPrevia = `Bens da faixa ${previa ? 'após aplicar' : 'atual'} (${(previa ?? faixa.bens).length})`;

  function situacao(id: number) {
    if (previa === null) return { texto: 'Seleção atual', estilo: 'bg-white' };
    if (!idsPrevios.has(id)) return { texto: 'Será removido', estilo: 'bg-red-50 text-red-800' };
    if (!idsAtuais.has(id)) return { texto: 'Novo', estilo: 'bg-green-50 text-green-800' };
    return { texto: 'Mantido', estilo: 'bg-white' };
  }

  async function aplicar() {
    if (enviando.current) return;
    enviando.current = true;
    setCarregando(true);
    setErro(null);
    try {
      await onAplicar(de, ate);
      onClose();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a faixa. Tente novamente.',
      );
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  }

  return (
    <ConfirmDialog
      open
      title='Ver/editar faixa'
      size='wide'
      confirmLabel='Aplicar faixa'
      cancelLabel='Cancelar'
      loadingLabel='Validando faixa...'
      loading={carregando}
      errorMessage={erro}
      onClose={onClose}
      onConfirm={() => void aplicar()}
      message={
        <div className='space-y-4'>
          <p className='text-sm text-gray-600'>
            Altere os limites para substituir esta faixa. A sequência e a disponibilidade dos bens
            serão validadas ao aplicar. Os bens da faixa não podem ser removidos individualmente.
          </p>
          <div className='grid gap-4 sm:grid-cols-2'>
            <NumeroPatrimonialAutocomplete
              id='editar-faixa-de'
              label='Número Patrimonial - De'
              ajuda={AJUDAS_MOVIMENTACAO.de}
              value={de}
              onChange={setDe}
              unidadeAdministrativaId={unidadeAdministrativaId}
              disabled={carregando}
            />
            <NumeroPatrimonialAutocomplete
              id='editar-faixa-ate'
              label='Número Patrimonial - Até'
              ajuda={AJUDAS_MOVIMENTACAO.ate}
              value={ate}
              onChange={setAte}
              unidadeAdministrativaId={unidadeAdministrativaId}
              disabled={carregando}
            />
          </div>
          <div className='flex items-center gap-2 text-sm'>
            Como buscar por faixa
            <MovimentacaoHelp
              label='Ajuda sobre edição da faixa'
              text={AJUDAS_MOVIMENTACAO.faixa}
            />
          </div>
          <p role='status' className='text-sm font-semibold'>
            {atualizando ? 'Atualizando prévia...' : tituloPrevia}
          </p>
          {erroPrevia ? (
            <p role='alert' className='text-sm text-red-700'>
              {erroPrevia} A seleção atual permanece inalterada.
            </p>
          ) : null}
          <div className='overflow-x-auto rounded-md border border-gray-200'>
            <table className='w-full text-left text-sm'>
              <thead className='border-b bg-[#F5F5F5] text-gray-700'>
                <tr>
                  <th className='p-3'>Número Patrimonial</th>
                  <th className='p-3'>Nome do Bem</th>
                  <th className='p-3'>
                    <span className='inline-flex items-center gap-2'>
                      Situação
                      <MovimentacaoHelp
                        label='Sobre a prévia da faixa'
                        text={AJUDAS_MOVIMENTACAO.previa}
                      />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((bem) => (
                  <tr key={bem.id} className={`border-b ${situacao(bem.id).estilo}`}>
                    <td className='p-3'>{bem.numero_patrimonial || 'Sem número patrimonial'}</td>
                    <td className='p-3'>{bem.nome}</td>
                    <td className='p-3'>{situacao(bem.id).texto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  );
}
