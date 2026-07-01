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
    numero_processo_baixa: string | null
    numero_nbbpm: string | null
    unidade_administrativa_origem: UnidadeAdministrativaSimple
    status: string
    status_display: string
    criado_por: UsuarioSimple
    data_criacao: string
    aprovado_por: UsuarioSimple | null
    data_aprovacao: string | null
    data_baixa: string | null
    total_itens: number
}

/**
 * CORRIGIDO — os nomes dos campos url_* abaixo foram alinhados ao
 * serializer real do backend (BaixaFisicaBemPatrimonialDetailSerializer):
 *   - url_enviar_solicitacao → url_solicitar
 *   - url_cancelar           → url_recusar
 * Também adicionado url_solicitar_correcao (novo endpoint).
 */
export interface BaixaFisicaDetail extends Omit<BaixaFisica, 'total_itens'> {
    itens: BaixaFisicaItem[]
    url_solicitar: string | null
    url_aprovar: string | null
    url_recusar: string | null
    /**
     * NOVO — presente apenas quando status === "solicitada" e o usuário
     * logado é Gestor. Aponta para o endpoint de solicitação de correção.
     */
    url_solicitar_correcao: string | null
    url_gerar_nbbpm: string | null
    /**
     * Presente apenas quando status === "aceita".
     * Aponta para o endpoint de geração do Laudo de Avaliação (PDF).
     */
    url_gerar_laudo: string | null
}

// ============================================================================
// PAYLOADS
// ============================================================================

export interface BaixaFisicaItemPayload {
    bem: number
}

export interface BaixaFisicaCreatePayload {
    numero_processo_baixa: string | null
    unidade_administrativa_origem: number
    data_baixa: string | null
    itens: BaixaFisicaItemPayload[]
}

export interface BaixaFisicaUpdatePayload {
    numero_processo_baixa?: string | null
    data_baixa?: string | null
    itens: BaixaFisicaItemPayload[]
}

/**
 * Payload do endpoint /recusar/. `motivo` é opcional aqui (regra do
 * backend real — ver BaixaFisicaCancelarSerializer).
 */
export interface BaixaFisicaRecusarPayload {
    motivo?: string
}

/**
 * NOVO — Payload do endpoint dedicado /solicitar-correcao/.
 * Diferente de recusar(): `motivo` é OBRIGATÓRIO aqui.
 * Endpoint backend: POST /baixa-fisica/{id}/solicitar-correcao/
 * Ver BaixaFisicaSolicitarCorrecaoSerializer (patch enviado).
 */
export interface BaixaFisicaSolicitarCorrecaoPayload {
    motivo: string
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