import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/unidades-list-page';
import { baixaFisicaService, downloadBlob } from '../../baixa-fisica/service/baixas.service';
import { nbbpmService } from '../services/nbbpm.service';
import type { NbbpmDocumentoRef } from '../types/nbbpm.types';

export function nbbpmFileName(nbbpm: NbbpmDocumentoRef) {
  return `NBBPM-${nbbpm.numero || nbbpm.id}.pdf`;
}

/**
 * Acesso ao documento de uma NBBPM já existente — usado pela consulta e pelo
 * detalhe, para que ambos entreguem exatamente o mesmo documento:
 * - `baixar`: baixa o PDF da NBBPM selecionada;
 * - `reemitir`: reemite o documento (mesmo número, sem novo sequencial e sem
 *   criar registros) e o baixa. Não recarrega nem altera a listagem.
 */
export function useNbbpmDocumento() {
  const [baixandoId, setBaixandoId] = useState<number | null>(null);
  const [reemitindoId, setReemitindoId] = useState<number | null>(null);
  const ocupado = baixandoId !== null || reemitindoId !== null;

  const baixar = useCallback(
    async (nbbpm: NbbpmDocumentoRef) => {
      if (ocupado) return;

      setBaixandoId(nbbpm.id);
      try {
        const blob = await baixaFisicaService.baixarNbbpmPdf(nbbpm.id);
        downloadBlob(blob, nbbpmFileName(nbbpm));
      } catch (error) {
        toast.error(getErrorMessage(error, 'Erro ao baixar documento da NBBPM'));
      } finally {
        setBaixandoId(null);
      }
    },
    [ocupado],
  );

  const reemitir = useCallback(
    async (nbbpm: NbbpmDocumentoRef) => {
      if (ocupado) return false;

      setReemitindoId(nbbpm.id);
      try {
        const blob = await nbbpmService.reemitir(nbbpm.id);
        downloadBlob(blob, nbbpmFileName(nbbpm));
        toast.success(`NBBPM ${nbbpm.numero || nbbpm.id} reemitida com o mesmo número.`);
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, 'Erro ao reemitir NBBPM'));
        return false;
      } finally {
        setReemitindoId(null);
      }
    },
    [ocupado],
  );

  return { baixandoId, reemitindoId, ocupado, baixar, reemitir };
}
