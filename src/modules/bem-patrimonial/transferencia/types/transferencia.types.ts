export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface TransferenciaUnidadeOrcamentaria {
  id: number
  codigo: string
  sigla: string
  nome: string
  label?: string
}

export interface TransferenciaUnidadeAdministrativa {
  id: number
  codigo: string
  sigla: string
  nome: string
  label?: string
  unidade_orcamentaria?: TransferenciaUnidadeOrcamentaria
}

export interface TransferenciaUsuario {
  id: number
  username: string
  nome_completo?: string | null
  email?: string | null
}

export interface TransferenciaBem {
  id: number
  numero_patrimonial: string | null
  nome: string
  descricao?: string | null
  marca?: string | null
  modelo?: string | null
  localizacao?: string | null
  status?: string
}

export interface TransferenciaItem {
  id?: number
  bem: TransferenciaBem
}

export interface TransferenciaBemPatrimonialListItem {
  id: number
  nome_bem: string | null
  numero_ntbpm: string | null
  numero_processo: string | null
  observacao: string
  criado_em: string
  atualizado_em: string
  total_itens: number
  unidade_orcamentaria_origem: TransferenciaUnidadeOrcamentaria
  unidade_orcamentaria_destino: TransferenciaUnidadeOrcamentaria
  criado_por: TransferenciaUsuario
  url_documento_ntbpm: string | null
}

export interface TransferenciaBemPatrimonialDetail
  extends Omit<TransferenciaBemPatrimonialListItem, 'nome_bem'> {
  unidade_administrativa_origem: TransferenciaUnidadeAdministrativa
  unidade_administrativa_destino: TransferenciaUnidadeAdministrativa
  itens: TransferenciaItem[]
}

export interface TransferenciaBemItemPayload {
  bem: number
}

export interface TransferenciaBemPatrimonialCreatePayload {
  unidade_orcamentaria_destino: number
  numero_processo: string
  observacao: string
  itens: TransferenciaBemItemPayload[]
}

export interface TransferenciaUoCadastroOption {
  id: number
  codigo: string
  nome: string
  label: string
  tem_ponto_central: boolean
}

export interface TransferenciaBemPatrimonialListParams {
  page?: number
  pageSize?: number
  search?: string
  nome_bem?: string
  numero_ntbpm?: string
  numero_processo?: string
  unidade_orcamentaria_origem?: number
  unidade_orcamentaria_destino?: number
  ordering?: string
}
