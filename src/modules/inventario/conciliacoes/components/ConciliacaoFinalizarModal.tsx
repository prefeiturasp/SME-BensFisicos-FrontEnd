import { ConfirmDialog } from '@/components/ConfirmDialog';

interface ConciliacaoFinalizarModalProps {
  readonly open: boolean;
  readonly loading: boolean;
  readonly errorMessage: string | null;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

const MESSAGE = (
  <>
    Tem certeza que deseja finalizar esta conciliação? Esta ação não
    pode ser desfeita e os itens em processo de baixa serão
    confirmados como <strong>Baixa Física</strong>.
  </>
);

export function ConciliacaoFinalizarModal({
  open,
  loading,
  errorMessage,
  onConfirm,
  onClose,
}: Readonly<ConciliacaoFinalizarModalProps>) {
  return (
    <ConfirmDialog
      open={open}
      title='Finalizar conciliação'
      message={MESSAGE}
      confirmLabel='Finalizar'
      loadingLabel='Finalizando...'
      loading={loading}
      errorMessage={errorMessage}
      variant='destructive'
      confirmationCheckboxLabel='Estou ciente que esta ação não pode ser desfeita.'
      closeButtonLabel='Fechar modal de finalização'
      testId='conciliacao-finalizar'
      testIds={{ container: 'conciliacao-finalizar-modal' }}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}