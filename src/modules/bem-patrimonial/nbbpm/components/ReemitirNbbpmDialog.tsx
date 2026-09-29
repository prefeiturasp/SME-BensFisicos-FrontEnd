import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { NbbpmDocumentoRef } from '../types/nbbpm.types';

type ReemitirNbbpmDialogProps = Readonly<{
  nbbpm: NbbpmDocumentoRef | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}>;

export function ReemitirNbbpmDialog({
  nbbpm,
  loading,
  onConfirm,
  onClose,
}: ReemitirNbbpmDialogProps) {
  return (
    <ConfirmDialog
      open={nbbpm !== null}
      title='Reemitir NBBPM'
      message={`Deseja reemitir a NBBPM ${nbbpm?.numero || nbbpm?.id}? O documento será gerado novamente com o mesmo número, sem criar uma nova nota nem consumir um novo sequencial.`}
      confirmLabel='Reemitir'
      loadingLabel='Reemitindo...'
      loading={loading}
      testId='reemitir-nbbpm-dialog'
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
