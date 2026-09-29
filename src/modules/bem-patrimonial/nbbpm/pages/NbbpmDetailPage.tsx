import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/auth/useAuth';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { CriadoPorValue } from '@/components/CriadoPorValue';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/unidades-list-page';
import { formatUsuarioObjetoLabel } from '@/lib/usuario-label';
import { BemDetailField, BemItemRow } from '@/modules/bem-patrimonial/components/BemDetailParts';
import { ReemitirNbbpmDialog } from '../components/ReemitirNbbpmDialog';
import { useNbbpmDocumento } from '../hooks/useNbbpmDocumento';
import { nbbpmService } from '../services/nbbpm.service';
import type { NbbpmBaixaDetail, NbbpmDetail } from '../types/nbbpm.types';
import { formatDataBR, formatDataHoraBR } from '../utils/formatters';
import { canAccessNbbpm, canReemitirNbbpm } from '../utils/permissions';

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`;

const PAGE_TITLE = 'Visualizar Nota de Baixa de Bem Patrimonial Móvel';

const BREADCRUMB_ITEMS = [
  { label: 'Bem Patrimonial' },
  { label: 'Notas de Baixa de Bens Patrimoniais', to: '/nbbpm' },
  { label: PAGE_TITLE, isActive: true },
];

function resolveUaLabel(ua: NbbpmBaixaDetail['unidade_administrativa_origem']) {
  return ua?.sigla || ua?.nome || '-';
}

function BaixaVinculadaSection({ baixa }: Readonly<{ baixa: NbbpmBaixaDetail }>) {
  return (
    <div
      className='space-y-2 border-t border-gray-100 px-6 py-4 first:border-t-0'
      data-testid={`nbbpm-baixa-${baixa.id}`}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-sm font-semibold text-[#00703C]'>
          Baixa Física #{String(baixa.id).padStart(3, '0')}
        </h3>
        <Button
          asChild
          variant='link'
          className='h-auto p-0 text-sm font-semibold text-[#00703C]'
        >
          <Link to={`/baixas-fisicas/${baixa.id}`}>Visualizar Baixa Física</Link>
        </Button>
      </div>

      <div className='grid gap-x-8 gap-y-2 lg:grid-cols-2'>
        <BemDetailField label='Unidade Administrativa'>
          {resolveUaLabel(baixa.unidade_administrativa_origem)}
        </BemDetailField>

        <BemDetailField label='Nº do Processo de Baixa'>
          {baixa.numero_processo_baixa || '-'}
        </BemDetailField>
      </div>

      <div className='space-y-2 pt-1'>
        <span className='text-sm font-semibold text-gray-700'>Bens desta Baixa Física</span>

        {(baixa.itens ?? []).length === 0 ? (
          <div className='text-sm text-gray-400'>Nenhum bem encontrado.</div>
        ) : (
          <div className='space-y-2'>
            {(baixa.itens ?? []).map((item) => (
              <BemItemRow
                key={item.id}
                label={
                  item.bem
                    ? `${item.bem.numero_patrimonial || '-'} ${item.bem.nome}`
                    : '-'
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NbbpmDetailPage() {
  const { user } = useAuth();

  if (!canAccessNbbpm(user)) {
    return (
      <div className='space-y-4 p-8'>
        <AppBreadcrumb items={BREADCRUMB_ITEMS} />
        <Card className='p-6 text-sm text-red-700'>
          Você não tem permissão para acessar as Notas de Baixa de Bens Patrimoniais.
        </Card>
      </div>
    );
  }

  return <NbbpmDetailContent />;
}

function NbbpmDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { baixandoId, reemitindoId, ocupado, baixar, reemitir } = useNbbpmDocumento();
  const [confirmandoReemissao, setConfirmandoReemissao] = useState(false);
  const [nbbpm, setNbbpm] = useState<NbbpmDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setNbbpm(null);
    setLoading(true);

    if (!id || !/^\d+$/.test(id)) {
      navigate('/nbbpm');
      return () => {
        active = false;
      };
    }

    const load = async () => {
      try {
        const data = await nbbpmService.retrieve(Number(id));
        if (active) setNbbpm(data);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Erro ao carregar NBBPM'));
        navigate('/nbbpm');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className='p-10 text-center'>
        <Loader2 data-testid='loader' className='mx-auto animate-spin' />
      </div>
    );
  }

  if (!nbbpm) return null;

  const baixando = baixandoId === nbbpm.id;
  const podeReemitir = canReemitirNbbpm(user, nbbpm);

  async function handleConfirmarReemissao() {
    if (!nbbpm) return;

    await reemitir(nbbpm);
    setConfirmandoReemissao(false);
  }

  return (
    <div className='space-y-4 p-8'>
      <AppBreadcrumb items={BREADCRUMB_ITEMS} />

      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>{PAGE_TITLE}</h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            onClick={() => navigate('/nbbpm')}
            className={`${ACTION_BUTTON_CLASS} h-10 w-10 p-0`}
            aria-label='Voltar'
          >
            <ArrowLeft size={18} />
          </Button>

          <Button
            type='button'
            className={ACTION_BUTTON_CLASS}
            disabled={ocupado}
            onClick={() => void baixar(nbbpm)}
          >
            <Download size={16} />
            {baixando ? 'Baixando...' : 'Baixar NBBPM'}
          </Button>

          {podeReemitir && (
            <Button
              type='button'
              className={ACTION_BUTTON_CLASS}
              disabled={ocupado}
              onClick={() => setConfirmandoReemissao(true)}
            >
              <RefreshCw size={16} />
              Reemitir NBBPM
            </Button>
          )}
        </div>
      </div>

      <Card className='overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <span className='text-sm font-bold text-[#2F7D57]'>NBBPM #{nbbpm.id}</span>
          <span className='text-sm font-semibold text-[#00703C]'>
            Número: {nbbpm.numero || '-'}
          </span>
        </div>

        <div className='divide-y divide-gray-100'>
          <div className='grid gap-x-8 gap-y-2 px-6 py-4 lg:grid-cols-2'>
            <BemDetailField label='Nº do Processo de Baixa'>
              {nbbpm.numero_processo_baixa || '-'}
            </BemDetailField>

            <BemDetailField label='Nº do Processo de Destinação Final'>
              {nbbpm.numero_processo_destinacao_final || '-'}
            </BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-4 lg:grid-cols-2'>
            <BemDetailField label='Data da Autorização'>
              {formatDataBR(nbbpm.data_autorizacao)}
            </BemDetailField>

            <BemDetailField label='Responsável'>{nbbpm.responsavel || '-'}</BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-4 lg:grid-cols-2'>
            <BemDetailField label='Gerada por'>
              <CriadoPorValue
                label={formatUsuarioObjetoLabel(nbbpm.criado_por)}
                data-testid='nbbpm-criado-por-value'
              />
            </BemDetailField>

            <BemDetailField label='Data de Criação'>
              {formatDataHoraBR(nbbpm.data_criacao)}
            </BemDetailField>
          </div>

          <div className='px-6 py-4'>
            <h2 className='text-sm font-semibold text-[#00703C]'>Baixas Físicas Vinculadas</h2>
            <p className='mt-1 text-xs text-gray-500'>
              Composição registrada no momento da geração desta NBBPM.
            </p>
          </div>

          {(nbbpm.baixas ?? []).length === 0 ? (
            <div className='px-6 py-4 text-sm text-gray-400'>
              Nenhuma Baixa Física vinculada.
            </div>
          ) : (
            (nbbpm.baixas ?? []).map((baixa) => (
              <BaixaVinculadaSection key={baixa.id} baixa={baixa} />
            ))
          )}
        </div>
      </Card>

      <ReemitirNbbpmDialog
        nbbpm={confirmandoReemissao ? nbbpm : null}
        loading={reemitindoId !== null}
        onConfirm={() => void handleConfirmarReemissao()}
        onClose={() => setConfirmandoReemissao(false)}
      />
    </div>
  );
}
