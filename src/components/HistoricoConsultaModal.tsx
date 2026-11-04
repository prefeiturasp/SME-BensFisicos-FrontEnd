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

function formatDateTimeBR(iso: string) {
  const data = new Date(iso);
  return {
    date: data.toLocaleDateString('pt-BR'),
    time: data.toLocaleTimeString('pt-BR'),
  };
}

function getInitial(nome: string | null) {
  return (nome?.trim() ?? '?').charAt(0).toUpperCase();
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
  const dataAtual = atual ? formatDateTimeBR(atual.alterado_em) : null;

  return (
    <dialog open aria-label='Histórico' onClose={onClose} className='fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-black/40 p-0'>
      <div className='mx-4 w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-8 py-6'>
          <h2 className='text-2xl font-bold text-gray-800'>Histórico</h2>
          <button type='button' onClick={onClose} aria-label='Fechar histórico' className='text-gray-400 transition-colors hover:text-gray-600'>
            <X size={22} />
          </button>
        </div>

        {registros === null && !erro && <p className='p-8 text-center text-sm text-gray-400'>Carregando...</p>}
        {erro && <p role='alert' className='p-8 text-center text-sm text-red-600'>Não foi possível carregar o histórico.</p>}
        {registros?.length === 0 && <p className='p-8 text-center text-sm text-gray-400'>Nenhum histórico encontrado.</p>}

        {registros && registros.length > 0 && (
          <div className='flex min-h-[400px] max-h-[70vh] flex-col overflow-hidden sm:flex-row sm:divide-x sm:divide-gray-200'>
            <div className='max-h-52 space-y-2 overflow-y-auto border-b px-4 py-4 sm:max-h-none sm:w-[40%] sm:border-b-0'>
              <p className='mb-3 px-2 text-sm font-semibold text-gray-500'>Usuário</p>
              {registros.map((item, index) => {
                const { date, time } = formatDateTimeBR(item.alterado_em);
                const selected = selecionado === index;
                const selectedCls = selected ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-100';
                const dateCls = selected ? 'text-gray-300' : 'text-gray-400';

                return (
                  <button
                    key={`${item.alterado_em}-${item.alterado_por ?? 'sem-autor'}-${index}`}
                    type='button'
                    onClick={() => setSelecionado(index)}
                    className={`flex w-full items-start gap-3 rounded-md px-4 py-3 text-left transition-colors ${selectedCls}`}
                  >
                    <span className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F7D57] text-sm font-bold text-white'>
                      {getInitial(item.alterado_por_nome)}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-semibold leading-tight'>{tituloGrupo(item)}</span>
                      <span className={`mt-0.5 block text-xs ${dateCls}`}>
                        Usuário: {formatUsuarioLabel(item.alterado_por_nome, item.alterado_por_rf)}
                      </span>
                    </span>
                    <span className={`shrink-0 text-right text-xs ${dateCls}`}>
                      <time className='block'>{date}</time>
                      <time className='block'>{time}</time>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <p className='mb-4 text-sm font-semibold text-gray-500'>Ações</p>
              {atual && (
                <div className='overflow-hidden rounded-lg border border-gray-200'>
                  <div className='flex items-start gap-3 border-b border-gray-200 px-4 py-3'>
                    <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F7D57] text-sm font-bold text-white'>
                      {getInitial(atual.alterado_por_nome)}
                    </span>
                    <p className='flex-1 text-sm text-gray-700'>
                      Usuário: {formatUsuarioLabel(atual.alterado_por_nome, atual.alterado_por_rf)}
                    </p>
                    <span className='shrink-0 text-right text-xs text-gray-400'>
                      <time className='block'>{dataAtual?.date}</time>
                      <time className='block'>{dataAtual?.time}</time>
                    </span>
                  </div>
                  <div className='space-y-2 px-4 py-4'>
                    <p className='mb-2 text-sm font-semibold text-gray-700'>Ações:</p>
                    {atual.acoes.map((acao, index) => (
                      <div key={`${acao.campo}-${index}`} className='text-sm text-gray-600'>
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
          </div>
        )}
      </div>
    </dialog>
  );
}
