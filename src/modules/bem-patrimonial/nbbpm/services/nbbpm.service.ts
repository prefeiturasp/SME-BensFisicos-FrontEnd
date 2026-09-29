import { api } from '@/api/http';
import { handleApiError } from '@/lib/api-error';
import type { NbbpmDetail, NbbpmListParams, NbbpmPaginatedResponse } from '../types/nbbpm.types';

function buildQuery(params: NbbpmListParams) {
  const query = new URLSearchParams();

  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('page_size', String(params.pageSize));
  if (params.search?.trim()) query.append('search', params.search.trim());
  if (params.ordering) query.append('ordering', params.ordering);

  return query;
}

/**
 * Serviço de consulta das NBBPMs geradas.
 *
 * Expõe leitura (`list`, `retrieve`) e a reemissão do documento (`reemitir`),
 * que NÃO cria nem duplica registros: o backend devolve o PDF da NBBPM
 * existente, com o mesmo número, sem consumir sequencial nem criar nova Nota
 * de Baixa. A geração continua em `baixaFisicaService.gerarNbbpmLote`, fluxo
 * da tela "Gerar NBBPM"; o download do documento existente continua em
 * `baixaFisicaService.baixarNbbpmPdf`.
 *
 * Escopo (UO/UA) e perfil de acesso são aplicados pelo backend em
 * `NBBPMViewSet.get_queryset` / `permission_classes`.
 */
export const nbbpmService = {
  async list(params: NbbpmListParams = {}): Promise<NbbpmPaginatedResponse> {
    try {
      const query = buildQuery(params);
      const { data } = await api.get<NbbpmPaginatedResponse>(`/nbbpm/?${query.toString()}`);
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao listar NBBPMs');
    }
  },

  /**
   * Detalhe de uma NBBPM — Baixas Físicas vinculadas, cada uma com sua
   * própria Unidade Administrativa e os bens que a compunham no momento
   * da geração da nota.
   */
  async retrieve(id: number): Promise<NbbpmDetail> {
    try {
      const { data } = await api.get<NbbpmDetail>(`/nbbpm/${id}/`);
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao buscar NBBPM');
    }
  },

  /**
   * Reemite o documento de uma NBBPM já gerada
   * (POST /nbbpm/{id}/reemitir/, sem corpo). Retorna o PDF.
   */
  async reemitir(id: number): Promise<Blob> {
    try {
      const { data } = await api.post<Blob>(`/nbbpm/${id}/reemitir/`, null, {
        responseType: 'blob',
      });
      return data;
    } catch (error) {
      handleApiError(error, 'Erro ao reemitir NBBPM');
    }
  },
};
