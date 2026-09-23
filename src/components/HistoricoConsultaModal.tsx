import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { api } from '@/api/http';
import { formatUsuarioLabel } from '@/lib/usuario-label';

interface HistoricoAcao {
  campo: string;
  valor_antigo: string | null;
  valor_novo: string | null;
  justificativa?: string | null;
}

interface HistoricoGrupo {
  alterado_em: string;
  alterado_por: number | null;
  alterado_por_nome: string | null;
  alterado_por_rf: string | null;
  acoes: HistoricoAcao[];
}

interface Props {
  readonly endpoint: string;
  readonly onClose: () => void;
}

function descricaoAcao(acao: HistoricoAcao) {
  if (acao.campo === 'acao') {
    if (acao.valor_novo === 'criado') return 'Registro criado';
    if (acao.valor_novo === 'excluido') return 'Registro excluído';
    return 'Registro alterado';
  }
  return acao.campo.replaceAll('_', ' ');
}

function tituloGrupo(grupo: HistoricoGrupo) {
  const operacao = grupo.acoes.find(acao => acao.campo === 'acao');
  return operacao ? descricaoAcao(operacao) : 'Registro alterado';
}

export function HistoricoConsultaModal({ endpoint, onClose }: Props) {
  const [registros, setRegistros] = useState<HistoricoGrupo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [selecionado, setSelecionado] = useState(0);

  useEffect(() => {
    let ativo = true;
    api.get<HistoricoGrupo[]>(endpoint).then(
      ({ data }) => {
        if (ativo) setRegistros(data);
      },
      () => {
        if (ativo) setErro(true);
      },
    );
    return () => { ativo = false; };
  }, [endpoint]);

  const atual = registros?.[selecionado];

  return (
    <dialog open aria-label='Histórico' onClose={onClose} className='fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-black/40 p-4'>
      <div className='w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-5'>
          <h2 className='text-xl font-bold text-gray-800'>Histórico</h2>
          <button type='button' onClick={onClose} aria-label='Fechar histórico' className='text-gray-500 hover:text-gray-700'>
            <X size={22} />
          </button>
        </div>

        {registros === null && !erro && <p className='p-8 text-center text-sm text-gray-500'>Carregando histórico...</p>}
        {erro && <p role='alert' className='p-8 text-center text-sm text-red-600'>Não foi possível carregar o histórico.</p>}
        {registros?.length === 0 && <p className='p-8 text-center text-sm text-gray-500'>Nenhum histórico disponível para este registro.</p>}

        {registros && registros.length > 0 && (
          <div className='flex min-h-72 max-h-[70vh] flex-col divide-gray-200 overflow-hidden sm:flex-row sm:divide-x'>
            <div className='max-h-52 overflow-y-auto border-b p-4 sm:max-h-none sm:w-2/5 sm:border-b-0'>
              {registros.map((item, index) => (
                <button
                  key={`${item.alterado_em}-${item.alterado_por ?? 'sem-autor'}-${index}`}
                  type='button'
                  onClick={() => setSelecionado(index)}
                  className={`mb-2 w-full rounded-md p-3 text-left text-sm ${selecionado === index ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className='block font-semibold'>{tituloGrupo(item)}</span>
                  <span className='block'>{formatUsuarioLabel(item.alterado_por_nome, item.alterado_por_rf)}</span>
                  <time className='block text-xs opacity-80'>{new Date(item.alterado_em).toLocaleString('pt-BR')}</time>
                </button>
              ))}
            </div>
            <div className='max-h-[70vh] flex-1 space-y-4 overflow-y-auto p-6'>
              <p className='font-semibold text-gray-700'>Ações</p>
              {atual?.acoes.map((acao, index) => (
                <div key={`${acao.campo}-${index}`} className='rounded-md border border-gray-200 p-3 text-sm text-gray-700'>
                  <p className='font-semibold'>{descricaoAcao(acao)}</p>
                  {acao.campo !== 'acao' && (
                    <p>De: {acao.valor_antigo || 'Não informado'} → Para: {acao.valor_novo || 'Não informado'}</p>
                  )}
                  {acao.justificativa && <p>{acao.justificativa}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
