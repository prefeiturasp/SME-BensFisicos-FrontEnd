import { useState } from 'react';
import { ArrowLeft, FileDown, History } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConciliacaoAuditoria } from '../components/ConciliacaoAuditoria';
import { ConciliacaoFinalizarModal } from '../components/ConciliacaoFinalizarModal';
import { ConciliacaoHistoricoModal } from '../components/ConciliacaoHistoricoModal';
import { ConciliacaoInfoGerais } from '../components/ConciliacaoInfoGerais';
import { ConciliacaoItensSection } from '../components/ConciliacaoItensSection';
import { ConciliacaoViewBreadcrumb } from '../components/ConciliacaoViewBreadcrumb';
import {
  useConciliacaoById,
  useConciliacaoFinalizar,
  useConciliacaoItens,
} from '../hooks/useConciliacoes';
import { conciliacoesService } from '../services/conciliacoes.service';
import { canAccessConciliacoes } from '../utils/permissions';

const PAGE_SIZE = 10;

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
  flex items-center gap-2
`;

const PRIMARY_BUTTON_CLASS =
  'h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md';

const ICON_BUTTON_CLASS = `
  h-10 w-10 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white rounded-md transition-colors
  flex items-center justify-center
`;

function buildSubtitulo(numeroConciliacao: string, siglaUa: string) {
  const sigla = siglaUa?.trim();
  if (sigla) {
    return `${numeroConciliacao} — ${sigla}`;
  }
  return numeroConciliacao;
}

export default function VisualizarConciliacaoPage() {
  const { user } = useAuth();
  const canAccess = canAccessConciliacoes(user);

  if (!canAccess) {
    return (
      <div className='space-y-4 p-8' data-testid='visualizar-conciliacao-page'>
        <ConciliacaoViewBreadcrumb />
        <Card className='p-6 text-sm text-red-700'>
          Você não tem permissão para visualizar Conciliações.
        </Card>
      </div>
    );
  }

  return <VisualizarConciliacaoContent />;
}

function VisualizarConciliacaoContent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const conciliacaoId = Number(id);
  const hasValidId = Number.isInteger(conciliacaoId) && conciliacaoId > 0;

  const conciliacaoQuery = useConciliacaoById(hasValidId ? conciliacaoId : null);
  const conciliacao = conciliacaoQuery.data;

  const itens = useConciliacaoItens({
    conciliacaoId: hasValidId ? conciliacaoId : 0,
    pageSize: PAGE_SIZE,
  });

  const finalizarMutation = useConciliacaoFinalizar();

  const [showHistorico, setShowHistorico] = useState(false);
  const [showFinalizar, setShowFinalizar] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!hasValidId) {
    return (
      <div className='space-y-4 p-8' data-testid='visualizar-conciliacao-page'>
        <ConciliacaoViewBreadcrumb />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Visualizar Conciliação
          </h1>
          <Button type='button' onClick={() => navigate('/conciliacoes')} className={ACTION_BUTTON_CLASS}>
            Cancelar
          </Button>
        </div>

        <Card className='p-6 text-sm text-red-700'>
          Identificador da Conciliação inválido.
        </Card>
      </div>
    );
  }

  if (conciliacaoQuery.isLoading) {
    return (
      <div className='flex items-center justify-center p-8' data-testid='visualizar-conciliacao-page'>
        <span className='text-sm text-gray-500'>Carregando detalhes da conciliação...</span>
      </div>
    );
  }

  if (conciliacaoQuery.isError || !conciliacao) {
    const message =
      conciliacaoQuery.error instanceof Error
        ? conciliacaoQuery.error.message
        : 'Não foi possível carregar a conciliação.';

    return (
      <div className='space-y-4 p-8' data-testid='visualizar-conciliacao-page'>
        <ConciliacaoViewBreadcrumb />

        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Visualizar Conciliação
          </h1>
          <Button type='button' onClick={() => navigate('/conciliacoes')} className={ACTION_BUTTON_CLASS}>
            Cancelar
          </Button>
        </div>

        <Card className='p-6 text-sm text-red-700'>{message}</Card>
      </div>
    );
  }

  const isAberta = conciliacao.esta_aberto;
  const subtitulo = buildSubtitulo(
    conciliacao.numero_conciliacao,
    conciliacao.unidade_administrativa_sigla,
  );

  async function handleExportar() {
    if (!conciliacao || exporting) return;
    setExporting(true);
    try {
      const blob = await conciliacoesService.exportar(conciliacao.id);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();

      globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao exportar o PDF da conciliação.';
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  function openFinalizar() {
    if (!conciliacao || !isAberta) return;
    setShowFinalizar(true);
  }

  function closeFinalizar() {
    if (finalizarMutation.isPending) return;
    setShowFinalizar(false);
    finalizarMutation.reset();
  }

  async function handleConfirmarFinalizacao() {
    if (!conciliacao) return;
    try {
      await finalizarMutation.mutateAsync(conciliacao.id);
      toast.success('Conciliação finalizada com sucesso.');
      setShowFinalizar(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao finalizar conciliação.';
      toast.error(message);
    }
  }

  const finalizarErrorMessage = (() => {
    if (!finalizarMutation.isError) return null;
    if (finalizarMutation.error instanceof Error) return finalizarMutation.error.message;
    return 'Erro ao finalizar conciliação.';
  })();

  return (
    <div className='space-y-4 p-8' data-testid='visualizar-conciliacao-page'>
      <ConciliacaoViewBreadcrumb />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-xl font-bold tracking-tight text-gray-700'>
            Visualizar Conciliação
          </h1>
          <p
            className='text-sm font-bold text-green-800 py-1'
            data-testid='visualizar-conciliacao-subtitulo'
          >
            {subtitulo}
          </p>
        </div>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            aria-label='Voltar'
            onClick={() => navigate('/conciliacoes')}
            className={ICON_BUTTON_CLASS}
            data-testid='visualizar-conciliacao-voltar'
          >
            <ArrowLeft size={18} />
          </Button>

          <Button
            type='button'
            onClick={() => setShowHistorico(true)}
            className={ACTION_BUTTON_CLASS}
            data-testid='visualizar-conciliacao-historico'
          >
            <History size={16} />
            Histórico
          </Button>

          <Button
            type='button'
            onClick={openFinalizar}
            disabled={!isAberta}
            className={PRIMARY_BUTTON_CLASS}
            data-testid='visualizar-conciliacao-finalizar'
          >
            Finalizar conciliação
          </Button>

          <Button
            type='button'
            disabled={exporting}
            onClick={handleExportar}
            className={ACTION_BUTTON_CLASS}
            aria-label='Exportar'
            data-testid='visualizar-conciliacao-exportar'
          >
            <FileDown size={16} />
            Exportar
          </Button>
        </div>
      </div>

      <Card className='p-6'>
        <ConciliacaoInfoGerais conciliacao={conciliacao} />
      </Card>

      <Card className='p-6'>
        <ConciliacaoAuditoria conciliacao={conciliacao} />
      </Card>

      <Card className='p-6'>
        <ConciliacaoItensSection
          itens={itens.itens}
          count={itens.count}
          loading={itens.loading}
          fetching={itens.fetching}
          page={itens.page}
          pageSize={PAGE_SIZE}
          numeroPatrimonial={itens.numeroPatrimonialInput}
          nome={itens.nomeInput}
          situacao={itens.situacaoFilter}
          ordering={itens.ordering}
          onPageChange={itens.setPage}
          onOrderingChange={(field) => {
            itens.setPage(1);
            itens.setOrdering(field);
          }}
          onNumeroPatrimonialChange={itens.setNumeroPatrimonialInput}
          onNomeChange={itens.setNomeInput}
          onSituacaoChange={itens.setSituacaoFilter}
          onSelectItem={(item) =>
            navigate(
              `/conciliacoes/${conciliacao.id}/itens/${item.id}/ocorrencia`,
            )
          }
        />
      </Card>

      {showHistorico && (
        <ConciliacaoHistoricoModal
          conciliacaoId={conciliacao.id}
          onClose={() => setShowHistorico(false)}
        />
      )}

      <ConciliacaoFinalizarModal
        open={showFinalizar}
        conciliacaoId={conciliacao.id}
        loading={finalizarMutation.isPending}
        errorMessage={finalizarErrorMessage}
        onConfirm={handleConfirmarFinalizacao}
        onClose={closeFinalizar}
      />
    </div>
  );
}
