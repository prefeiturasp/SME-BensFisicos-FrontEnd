import { api } from '@/api/http';
import { handleApiError } from '@/lib/api-error';
import type { NbbpmListParams, NbbpmPaginatedResponse } from '../types/nbbpm.types';

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
 * Intencionalmente expõe SOMENTE leitura (`list`): a listagem não cria,
 * altera nem duplica registros. A geração continua em
 * `baixaFisicaService.gerarNbbpmLote`, fluxo da tela "Gerar NBBPM".
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
};
