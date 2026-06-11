export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface MovimentacaoUnidadeOrcamentaria {
  id: number
  codigo: string
  sigla: string
  nome: string
  ativa?: boolean
}

export interface MovimentacaoUnidadeAdministrativa {
  id: number
  codigo: string
  sigla: string
  nome: string
  status?: string
  unidade_orcamentaria?: MovimentacaoUnidadeOrcamentaria
}

export interface MovimentacaoUsuario {
  id: number
  username: string
  nome_completo?: string | null
  email?: string | null
}

export interface MovimentacaoBem {
  id: number
  numero_patrimonial: string | null
  nome: string
  descricao?: string | null
  marca?: string | null
  modelo?: string | null
  localizacao?: string | null
  status: string
}

export interface MovimentacaoBemItem {
  id?: number
  bem: MovimentacaoBem
}

export interface MovimentacaoBemPatrimonialListItem {
  id: number
  status: string
  status_display: string
  numero_cimbpm: string | null
  observacao: string
  criado_em: string
  atualizado_em: string
  total_itens: number
  unidade_administrativa_origem: MovimentacaoUnidadeAdministrativa
  unidade_orcamentaria_origem: MovimentacaoUnidadeOrcamentaria
  unidade_administrativa_destino: MovimentacaoUnidadeAdministrativa
  unidade_orcamentaria_destino: MovimentacaoUnidadeOrcamentaria
  solicitado_por: MovimentacaoUsuario
}

export interface MovimentacaoBemPatrimonialDetail extends MovimentacaoBemPatrimonialListItem {
  aprovado_por: MovimentacaoUsuario | null
  rejeitado_por: MovimentacaoUsuario | null
  cancelado_por: MovimentacaoUsuario | null
  itens: MovimentacaoBemItem[]
  url_aprovar: string | null
  url_rejeitar: string | null
  url_cancelar: string | null
  url_historico: string | null
  url_documento_cimbpm: string | null
}

export interface MovimentacaoBemItemPayload {
  bem: number
}

export interface MovimentacaoBemPatrimonialCreatePayload {
  unidade_administrativa_origem: number
  unidade_orcamentaria_destino: number
  unidade_administrativa_destino: number
  observacao: string
  itens: MovimentacaoBemItemPayload[]
}

export interface MovimentacaoBemPatrimonialListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  unidade_administrativa_origem?: number
  unidade_administrativa_destino?: number
  numero_cimbpm?: string
  ordering?: string
}
