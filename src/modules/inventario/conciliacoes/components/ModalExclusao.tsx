import { ConfirmDialog, type ConfirmDialogProps } from '@/components/ConfirmDialog';

type ModalExclusaoProps = Pick<
  ConfirmDialogProps,
  'open' | 'loading' | 'errorMessage' | 'onConfirm' | 'onClose'
>;

const DEFAULT_TITLE = 'Excluir ocorrência';
const DEFAULT_MESSAGE =
  'Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.';
const DEFAULT_CONFIRM_LABEL = 'Excluir';
const DEFAULT_LOADING_LABEL = 'Excluindo...';

export function ModalExclusao({
  open,
  loading = false,
  errorMessage = null,
  onConfirm,
  onClose,
}: Readonly<ModalExclusaoProps>) {
  return (
    <ConfirmDialog
      open={open}
      title={DEFAULT_TITLE}
      message={DEFAULT_MESSAGE}
      confirmLabel={DEFAULT_CONFIRM_LABEL}
      loadingLabel={DEFAULT_LOADING_LABEL}
      loading={loading}
      errorMessage={errorMessage}
      variant='destructive'
      closeButtonLabel='Fechar modal de exclusão'
      testId='ocorrencia-modal-exclusao'
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
