import { ConfirmDialog, type ConfirmDialogProps } from '@/components/ConfirmDialog';

type ConciliacaoFinalizarModalProps = Pick<
  ConfirmDialogProps,
  'open' | 'loading' | 'errorMessage' | 'onConfirm' | 'onClose'
>;

const TITLE = 'Finalizar conciliação';
const MESSAGE = (
  <>
    Tem certeza que deseja finalizar esta conciliação? Esta ação não pode ser
    desfeita e os itens em processo de baixa serão confirmados como{' '}
    <strong>Baixa Física</strong>.
  </>
);
const CONFIRM_LABEL = 'Finalizar';
const LOADING_LABEL = 'Finalizando...';

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
      title={TITLE}
      message={MESSAGE}
      confirmLabel={CONFIRM_LABEL}
      loadingLabel={LOADING_LABEL}
      loading={loading}
      errorMessage={errorMessage}
      variant='primary'
      closeButtonLabel='Fechar modal de finalização'
      testId='conciliacao-finalizar'
      testIds={{ container: 'conciliacao-finalizar-modal' }}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
