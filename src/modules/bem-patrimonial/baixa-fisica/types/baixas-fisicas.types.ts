// ============================================================================
// MODELOS RELACIONADOS
// ============================================================================

export interface UnidadeAdministrativaSimple {
    id: number
    nome: string
    sigla: string
    codigo: string
    status: string
}

export interface UsuarioSimple {
    id: number
    username: string
    nome_completo: string
    email: string
}

export interface BemPatrimonialSimple {
    id: number
    numero_patrimonial: string
    nome: string
    descricao: string
    status: string
}

export interface BaixaFisicaItem {
    id: number
    bem: BemPatrimonialSimple
}

// ============================================================================
// BAIXA FÍSICA
// ============================================================================

export interface BaixaFisica {
    id: number
    numero_processo_baixa: string
    numero_nbbpm: string | null
    unidade_administrativa_origem: UnidadeAdministrativaSimple
    status: string
    status_display: string
    criado_por: UsuarioSimple
    data_criacao: string
    aprovado_por: UsuarioSimple | null
    data_aprovacao: string | null
    data_baixa: string
    total_itens: number
}

export interface BaixaFisicaDetail extends Omit<BaixaFisica, 'total_itens'> {
    itens: BaixaFisicaItem[]
    url_enviar_solicitacao: string | null
    url_aprovar: string | null
    url_cancelar: string | null
    url_gerar_nbbpm: string | null
}

// ============================================================================
// PAYLOADS
// ============================================================================

export interface BaixaFisicaItemPayload {
    bem: number
}

export interface BaixaFisicaCreatePayload {
    numero_processo_baixa: string
    unidade_administrativa_origem: number
    data_baixa: string
    itens: BaixaFisicaItemPayload[]
}

export interface BaixaFisicaUpdatePayload {
    numero_processo_baixa?: string
    data_baixa?: string
    itens: BaixaFisicaItemPayload[]
}

export interface BaixaFisicaCancelarPayload {
    motivo?: string
}

// ============================================================================
// PARAMS
// ============================================================================

export interface BaixaFisicaListParams {
    page?: number
    search?: string
    status?: string
    unidade_administrativa_origem?: number
    ordering?: string
    data_criacao__gte?: string
    data_criacao__lte?: string
    data_aprovacao__gte?: string
    data_aprovacao__lte?: string
    ids?: string
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

// ============================================================================
// HISTÓRICO
// ============================================================================

export interface HistoricoEntry {
    id: number
    campo: string
    valor_antigo: string | null
    valor_novo: string | null
    justificativa: string | null
    alterado_por: string | null
    data_alteracao: string
}

export interface HistoricoGroup {
    key: string
    user: string | null
    date: string
    time: string
    items: HistoricoEntry[]
}

// ============================================================================
// COMPONENTES
// ============================================================================

export interface UnidadeAdministrativaSelectOption {
    id: number
    nome: string
    sigla: string
    codigo: string
}

export interface ItemRow {
    rowId: number
    bem: {
        id: number
        numero_patrimonial: string
        nome: string
        descricao: string
        status: string
    } | null
}

export interface EditRow {
    rowId: number
    item: BaixaFisicaItem | null
}