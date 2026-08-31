import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import {
    ArrowLeft,
    History,
    Plus,
    Trash2,
    X,
    ChevronDown,
    SquarePen,
    FileDown,
    Search,
} from "lucide-react"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { bemService, type Bem } from "../../bem/services/bem.service"
import HistoricoModal from "../modals/HistoricoModal"
import ConfirmarAceiteModal from "../modals/ConfirmarAceiteModal"
import type {
    BaixaFisicaDetail,
    BaixaFisicaItem,
    EditRow,
} from "../types/baixas-fisicas.types"

import { baixaFisicaService } from "../service/baixas.service"

// ============================================================================
// STYLES
// ============================================================================

const ACTION_BUTTON_CLASS =
    "h-10 px-5 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors flex items-center gap-2 text-sm"

const PRIMARY_BUTTON_CLASS =
    "h-10 px-5 bg-[#2F7D57] text-white font-semibold rounded-md hover:bg-[#256947] transition-colors flex items-center gap-2 text-sm"

// Status "aguardando_envio" é exibido como "Em elaboração" na UI
const STATUS_EM_ELABORACAO = "aguardando_envio"

// ============================================================================
// HELPERS
// ============================================================================

function formatDateBR(dateString: string | null | undefined): string {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

function formatDateTimeBR(dateString: string | null | undefined): string {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString("pt-BR")
}

function mapItensParaLinhas(itens: BaixaFisicaItem[], gerarRowId: () => number): EditRow[] {
    if (itens.length === 0) return [{ rowId: gerarRowId(), item: null }]
    return itens.map((i) => ({ rowId: gerarRowId(), item: i }))
}

// ============================================================================
// STATUS BADGE
// ============================================================================

interface StatusBadgeProps {
    readonly status: string
    readonly statusDisplay: string
}

function StatusBadge({ status, statusDisplay }: StatusBadgeProps) {
    const colorMap: Record<string, string> = {
        aguardando_envio: "text-yellow-700",
        aceita: "text-[#2F7D57]",
        recusada: "text-red-600",
        cancelada: "text-gray-500",
        solicitada: "text-blue-700",
    }

    const cls = colorMap[status] ?? "text-gray-600"

    return (
        <span className={`text-sm font-bold ${cls}`}>
            Status: {statusDisplay}
        </span>
    )
}

// ============================================================================
// BEM SELECTOR (modo edição — status Em elaboração)
// ============================================================================

interface BemSelectorProps {
    readonly selectedIds: number[]
    readonly unidadeAdministrativa: number | string
    readonly onSelect: (bem: Bem) => void
}

function BemSelectorDropdown({
    selectedIds,
    unidadeAdministrativa,
    onSelect,
}: BemSelectorProps) {
    const [inputValue, setInputValue] = useState("")
    const [results, setResults] = useState<Bem[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const ref = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => { document.removeEventListener("mousedown", handleClickOutside) }
    }, [])

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    const search = useCallback(
        async (query: string) => {
            if (!unidadeAdministrativa) {
                setResults([])
                return
            }
            setLoading(true)
            try {
                const res = await bemService.list({
                    search: query,
                    status: "aprovado",
                    unidade_administrativa: String(unidadeAdministrativa),
                })
                setResults(res.results)
            } finally {
                setLoading(false)
            }
        },
        [unidadeAdministrativa]
    )

    const handleFocus = () => {
        setOpen(true)
        if (results.length === 0) search("")
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setInputValue(val)
        setOpen(true)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => { search(val) }, 300)
    }

    const handleSelect = (bem: Bem) => {
        onSelect(bem)
        setInputValue("")
        setOpen(false)
    }

    const renderDropdownContent = () => {
        if (loading) {
            return <div className="px-3 py-2 text-sm text-gray-400">Buscando...</div>
        }
        if (results.length === 0) {
            return <div className="px-3 py-2 text-sm text-gray-400">Nenhum bem encontrado.</div>
        }
        return results.map((bem) => {
            const already = selectedIds.includes(bem.id)
            return (
                <button
                    key={bem.id}
                    type="button"
                    disabled={already}
                    onClick={() => handleSelect(bem)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-0 ${already
                        ? "text-gray-300 cursor-not-allowed bg-gray-50"
                        : "hover:bg-[#2F7D57] hover:text-white cursor-pointer"
                        }`}
                >
                    <span className="font-mono mr-2">{bem.numero_patrimonial}</span>
                    {bem.nome}
                </button>
            )
        })
    }

    return (
        <div className="relative flex-1" ref={ref}>
            <input
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder="Selecione um bem"
                className="h-[42px] w-full px-4 text-sm text-gray-700 bg-transparent outline-none"
            />
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-[9999] max-h-56 overflow-auto">
                    {renderDropdownContent()}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// ITEM ROW — modo edição (Em elaboração + ação "Editar" acionada)
// ============================================================================

interface EditItemRowProps {
    readonly item: BaixaFisicaItem | null
    readonly isLast: boolean
    readonly allSelectedIds: number[]
    readonly unidadeAdministrativa: number | string
    readonly onRemove: () => void
    readonly onAdd: () => void
    readonly onSelect: (bem: Bem) => void
    readonly onClear: () => void
}

function EditItemRow({
    item,
    isLast,
    allSelectedIds,
    unidadeAdministrativa,
    onRemove,
    onAdd,
    onSelect,
    onClear,
}: EditItemRowProps) {
    return (
        <div
            className={`relative flex items-stretch border border-gray-300 rounded bg-white overflow-visible ${item ? "z-10" : "z-50"
                }`}
        >
            <div className="relative flex-1 px-4 flex items-center text-sm text-gray-700 min-h-[42px] overflow-visible">
                {item ? (
                    <span className="truncate">
                        {item.bem.numero_patrimonial} -{" "}
                        {item.bem.nome || item.bem.descricao}
                    </span>
                ) : (
                    <BemSelectorDropdown
                        selectedIds={allSelectedIds}
                        unidadeAdministrativa={unidadeAdministrativa}
                        onSelect={onSelect}
                    />
                )}
            </div>

            <div className="flex items-stretch divide-x divide-gray-300 border-l border-gray-300 shrink-0">
                <button
                    type="button"
                    onClick={item ? onClear : onRemove}
                    className="w-9 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover"
                >
                    <X size={14} />
                </button>

                <button
                    type="button"
                    className="w-9 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ChevronDown size={14} />
                </button>

                {isLast && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="w-10 flex items-center justify-center text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white transition-colors"
                        title="Adicionar item"
                    >
                        <Plus size={16} />
                    </button>
                )}

                {isLast && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="w-10 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                        title="Excluir linha"
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// TABELA DE VALIDAÇÃO — modo "Validar Baixa" (status solicitada)
// ============================================================================

interface ValidacaoTableProps {
    readonly itens: BaixaFisicaItem[]
    readonly checkedIds: Set<number>
    readonly onToggle: (itemId: number) => void
}

function ValidacaoTable({ itens, checkedIds, onToggle }: ValidacaoTableProps) {
    if (itens.length === 0) {
        return <p className="text-sm text-gray-400 px-1">Nenhum item corresponde ao filtro.</p>
    }

    return (
        <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full text-sm">
                <thead className="bg-[#F5F5F5] border-b border-gray-200">
                    <tr className="text-left text-gray-600 font-semibold">
                        <th className="p-3 w-24">Validação</th>
                        <th className="p-3 w-56">Número Patrimonial</th>
                        <th className="p-3">Nome do Bem</th>
                    </tr>
                </thead>
                <tbody>
                    {itens.map((item) => {
                        const checked = checkedIds.has(item.id)
                        return (
                            <tr
                                key={item.id}
                                className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${checked ? "bg-green-50" : "hover:bg-gray-50"
                                    }`}
                                onClick={() => onToggle(item.id)}
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggle(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="accent-[#2F7D57] w-4 h-4 cursor-pointer"
                                        aria-label={`Validar item ${item.bem.numero_patrimonial}`}
                                    />
                                </td>
                                <td className="p-3 font-mono text-xs text-gray-600">
                                    {item.bem.numero_patrimonial}
                                </td>
                                <td className="p-3 text-sm text-gray-700">
                                    {item.bem.nome || item.bem.descricao}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

// ============================================================================
// ITEM ROW — modo somente leitura (Em elaboração sem edição, aceita, recusada)
// ============================================================================

function ReadOnlyItemRow({ item }: { readonly item: BaixaFisicaItem }) {
    return (
        <div className="border border-gray-300 rounded bg-white px-4 py-2.5 text-sm text-gray-700">
            <span className="font-mono mr-2">{item.bem.numero_patrimonial}</span>
            {item.bem.nome || item.bem.descricao}
        </div>
    )
}

// ============================================================================
// PAGE
// ============================================================================

let nextRowId = 1
const gerarRowId = () => nextRowId++

export default function VerBaixaPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams] = useSearchParams()

    const [baixa, setBaixa] = useState<BaixaFisicaDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // ---- Modo edição (Em elaboração) ----
    // A tela abre sempre em modo de VISUALIZAÇÃO. A alteração dos campos só
    // é liberada após o acionamento explícito da ação "Editar" — ou quando a
    // listagem já envia o usuário direto para a edição (?editar=1).
    const [modoEdicao, setModoEdicao] = useState(searchParams.get("editar") === "1")
    const [editRows, setEditRows] = useState<EditRow[]>([])
    const [hasChanges, setHasChanges] = useState(false)

    // ---- Modo "Validar Baixa" (solicitada) — estado 100% local ----
    const [filtroValidacao, setFiltroValidacao] = useState("")
    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
    const [aceitando, setAceitando] = useState(false)

    // ---- Modais ----
    const [showHistorico, setShowHistorico] = useState(false)
    const [showConfirmarAceite, setShowConfirmarAceite] = useState(false)
    const [showRecusarModal, setShowRecusarModal] = useState(false)
    const [recusando, setRecusando] = useState(false)
    const [motivoRecusa, setMotivoRecusa] = useState("")

    useEffect(() => {
        const fetchBaixa = async () => {
            try {
                if (!id) return
                const data = await baixaFisicaService.retrieve(Number(id))
                setBaixa(data)
                setEditRows(mapItensParaLinhas(data.itens, gerarRowId))
                // Os checkboxes de validação SEMPRE começam vazios: não há
                // persistência no backend, então não há estado anterior
                // para restaurar (cada visita à tela começa do zero).
                setCheckedIds(new Set())
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchBaixa()
    }, [id])

    // ── Derivados ────────────────────────────────────────────────────────

    // Somente baixas "Em elaboração" podem ser editadas...
    const isEmElaboracao = baixa?.status === STATUS_EM_ELABORACAO
    // ...e apenas depois que o usuário aciona a ação "Editar".
    const podeEditar = isEmElaboracao && modoEdicao
    // Tela "Validar Baixa" — apenas para baixas com status "solicitada"
    const isValidando = baixa?.status === "solicitada"

    const allSelectedEditIds = editRows.filter((r) => r.item).map((r) => r.item!.bem.id)

    const filtroLower = filtroValidacao.trim().toLowerCase()
    const itensFiltrados = (baixa?.itens ?? []).filter((item) => {
        if (!filtroLower) return true
        return (
            item.bem.numero_patrimonial.toLowerCase().includes(filtroLower) ||
            item.bem.nome.toLowerCase().includes(filtroLower)
        )
    })

    const todosValidados =
        baixa !== null &&
        baixa.itens.length > 0 &&
        baixa.itens.every((item) => checkedIds.has(item.id))

    // ── Handlers — modo edição ──────────────────────────────────────────

    const handleEntrarEmEdicao = () => {
        if (!baixa) return
        setEditRows(mapItensParaLinhas(baixa.itens, gerarRowId))
        setHasChanges(false)
        setModoEdicao(true)
        toast.info("Modo de edição habilitado.")
    }

    const handleCancelarEdicao = () => {
        if (!baixa) return
        setEditRows(mapItensParaLinhas(baixa.itens, gerarRowId))
        setHasChanges(false)
        setModoEdicao(false)
    }

    const handleSelectBem = (rowId: number, bem: Bem) => {
        const numeroPatrimonial = bem.numero_patrimonial ?? `SEM-NUMERO-${bem.id}`
        setEditRows((prev) =>
            prev.map((r): EditRow =>
                r.rowId === rowId
                    ? {
                        ...r,
                        item: {
                            id: -rowId,
                            bem: {
                                id: bem.id,
                                numero_patrimonial: numeroPatrimonial,
                                nome: bem.nome,
                                descricao: bem.descricao,
                                status: bem.status,
                            },
                        },
                    }
                    : r
            )
        )
        setHasChanges(true)
    }

    const handleClearRow = (rowId: number) => {
        setEditRows((prev) =>
            prev.map((r) => r.rowId === rowId ? { ...r, item: null } : r)
        )
        setHasChanges(true)
    }

    const handleRemoveRow = (rowId: number) => {
        setEditRows((prev) => {
            const next = prev.filter((r) => r.rowId !== rowId)
            if (next.length === 0) return [{ rowId: gerarRowId(), item: null }]
            return next
        })
        setHasChanges(true)
    }

    const handleAddRow = () => {
        setEditRows((prev) => [...prev, { rowId: gerarRowId(), item: null }])
    }

    const handleSave = async () => {
        if (!baixa) return
        setSaving(true)
        try {
            const itens = editRows
                .filter((r) => r.item)
                .map((r) => ({ bem: r.item!.bem.id }))
            const updated = await baixaFisicaService.update(baixa.id, { itens })
            setBaixa(updated)
            setEditRows(mapItensParaLinhas(updated.itens, gerarRowId))
            setHasChanges(false)
            // Após salvar, a tela volta ao modo de visualização.
            setModoEdicao(false)
            toast.success("Baixa Física atualizada com sucesso.")
        } catch (err) {
            console.error(err)
            toast.error(
                err instanceof Error ? err.message : "Erro ao salvar as alterações da Baixa Física."
            )
        } finally {
            setSaving(false)
        }
    }

    // ── Handlers — modo "Validar Baixa" ─────────────────────────────────

    const toggleCheck = (itemId: number) => {
        setCheckedIds((prev) => {
            const next = new Set(prev)
            if (next.has(itemId)) next.delete(itemId)
            else next.add(itemId)
            return next
        })
    }

    // Confirma o aceite: chama aprovar() diretamente (sem endpoint de
    // validação intermediário — os checkboxes são só conferência visual
    // do gestor antes de decidir) e navega para a própria tela de
    // detalhe, já em modo somente leitura.
    const handleConfirmarAceite = async () => {
        if (!baixa) return
        setAceitando(true)
        try {
            await baixaFisicaService.aprovar(baixa.id)
            setShowConfirmarAceite(false)
            toast.success("Baixa física aceita com sucesso!")
            navigate(`/baixas-fisicas/${baixa.id}`, { replace: true })
        } catch (err) {
            console.error(err)
            toast.error(
                err instanceof Error ? err.message : "Erro ao confirmar aceite da baixa."
            )
            setShowConfirmarAceite(false)
        } finally {
            setAceitando(false)
        }
    }

    const handleRecusar = async () => {
        if (!baixa) return
        setRecusando(true)
        try {
            await baixaFisicaService.recusar(baixa.id, { motivo: motivoRecusa.trim() || undefined })
            setShowRecusarModal(false)
            setMotivoRecusa("")
            toast.success("Baixa física recusada.")
            setTimeout(() => {
                navigate(-1)
            }, 1500)
        } catch (err) {
            console.error(err)
            toast.error(err instanceof Error ? err.message : "Erro ao recusar a baixa.")
            setShowRecusarModal(false)
        } finally {
            setRecusando(false)
        }
    }

    // Navega para a página própria de solicitação de correção
    const handleIrParaSolicitarCorrecao = () => {
        if (!baixa) return
        navigate(`/baixas-fisicas/${baixa.id}/solicitar-correcao`)
    }

    // ── Downloads ────────────────────────────────────────────────────────

    const handleGerarNbbpm = async () => {
        if (!baixa) return
        try {
            const blob = await baixaFisicaService.gerarNbbpm(baixa.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `NBBPM-${baixa.numero_processo_baixa ?? baixa.id}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            toast.error("Erro ao gerar a NBBPM.")
        }
    }

    const handleGerarLaudo = async () => {
        if (!baixa) return
        try {
            const blob = await baixaFisicaService.gerarLaudo(baixa.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `Laudo-Avaliacao-${baixa.numero_processo_baixa ?? baixa.id}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            toast.error("Erro ao gerar o Laudo de Avaliação.")
        }
    }

    // ── Loading / not found ──────────────────────────────────────────────

    if (loading) {
        return <div className="p-8 text-sm text-gray-500">Carregando...</div>
    }

    if (!baixa) {
        return <div className="p-8 text-sm text-gray-500">Baixa não encontrada</div>
    }

    const ua = baixa.unidade_administrativa_origem

    let tituloPagina = "Visualizar Baixa Física de Bem Patrimonial"
    if (isValidando) {
        tituloPagina = "Validar Baixa Física de Bem Patrimonial"
    } else if (podeEditar) {
        tituloPagina = "Editar Baixa Física de Bem Patrimonial"
    }

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="p-8 space-y-4">
            <AppBreadcrumb
                items={[
                    { label: "Bem Patrimonial" },
                    { label: "Baixa Física de Bens Patrimoniais" },
                    { label: tituloPagina, isActive: true },
                ]}
            />

            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-700">{tituloPagina}</h1>

                <div className="flex items-center gap-2">
                    {/* Em elaboração + modo visualização → ação "Editar".
                        É ela que habilita a alteração dos campos. */}
                    {isEmElaboracao && !modoEdicao && (
                        <Button
                            type="button"
                            onClick={handleEntrarEmEdicao}
                            className={ACTION_BUTTON_CLASS}
                        >
                            <SquarePen size={16} />
                            Editar
                        </Button>
                    )}

                    {/* Em elaboração + modo edição → "Salvar Edição" e "Cancelar Edição" */}
                    {podeEditar && (
                        <>
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                                className={PRIMARY_BUTTON_CLASS}
                            >
                                {saving ? "Salvando..." : "Salvar Edição"}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCancelarEdicao}
                                disabled={saving}
                                className={ACTION_BUTTON_CLASS}
                            >
                                Cancelar Edição
                            </Button>
                        </>
                    )}

                    {/* Ações da tela "Validar Baixa" — apenas status "solicitada" */}
                    {isValidando && (
                        <>
                            {/* "Solicitar correção" some quando todos os itens já
                                estão validados (replica o protótipo) */}
                            {!todosValidados && (
                                <Button
                                    type="button"
                                    onClick={handleIrParaSolicitarCorrecao}
                                    className={ACTION_BUTTON_CLASS}
                                >
                                    Solicitar correção
                                </Button>
                            )}
                            <Button
                                type="button"
                                onClick={() => setShowRecusarModal(true)}
                                className="h-10 px-5 bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors"
                            >
                                Recusar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setShowConfirmarAceite(true)}
                                disabled={!todosValidados}
                                title={
                                    todosValidados
                                        ? "Aceitar solicitação"
                                        : "Valide todos os itens para habilitar"
                                }
                                className={PRIMARY_BUTTON_CLASS}
                            >
                                Aceitar
                            </Button>
                        </>
                    )}

                    {baixa.status === "aceita" && baixa.url_gerar_laudo && (
                        <Button type="button" onClick={handleGerarLaudo} className={ACTION_BUTTON_CLASS}>
                            <FileDown size={14} />
                            Baixar Laudo de Avaliação
                        </Button>
                    )}

                    {baixa.status === "aceita" && baixa.url_gerar_nbbpm && (
                        <Button type="button" onClick={handleGerarNbbpm} className={ACTION_BUTTON_CLASS}>
                            <FileDown size={14} />
                            Baixar NBBPM
                        </Button>
                    )}

                    {!isValidando && (
                        <Button
                            type="button"
                            onClick={() => setShowHistorico(true)}
                            className={ACTION_BUTTON_CLASS}
                        >
                            <History size={14} />
                            Histórico
                        </Button>
                    )}

                    <Button type="button" onClick={() => navigate(-1)} className={ACTION_BUTTON_CLASS}>
                        <ArrowLeft size={14} />
                        Voltar
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md overflow-visible shadow-sm">
                {/* Unidade Administrativa — exibida em destaque no modo Validar Baixa,
                    refletindo o protótipo */}
                {isValidando && (
                    <div className="px-6 py-4 border-b border-gray-200">
                        <Label className="text-sm font-semibold text-gray-700 block mb-1">
                            Unidade Administrativa

                            <div className="h-11 w-full max-w-md rounded border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-400">
                                {ua.codigo} - {ua.nome}
                            </div>
                        </Label>
                    </div>
                )}

                {!isValidando && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <span className="text-sm font-bold text-[#2F7D57]">
                            Baixa Física #{String(baixa.id).padStart(3, "0")} - UA:{" "}
                            {ua.codigo} - {ua.sigla}
                        </span>
                        <StatusBadge status={baixa.status} statusDisplay={baixa.status_display} />
                    </div>
                )}

                {!isValidando && (
                    <div className="divide-y divide-gray-100">
                        <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                            <span className="text-sm font-semibold text-gray-700">
                                Usuário que solicitou a baixa:
                            </span>
                            <span className="text-sm text-[#2F7D57]">
                                {baixa.criado_por.nome_completo}
                            </span>
                        </div>

                        <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                            <span className="text-sm font-semibold text-gray-700">
                                Data da solicitação:
                            </span>
                            <span className="text-sm text-gray-700">
                                {formatDateTimeBR(baixa.data_criacao)}
                            </span>
                        </div>

                        <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                            <span className="text-sm font-semibold text-gray-700">
                                Gestor que aprovou a baixa:
                            </span>
                            <span className="text-sm text-[#2F7D57]">
                                {baixa.aprovado_por?.nome_completo ?? "-"}
                            </span>
                        </div>

                        <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                            <span className="text-sm font-semibold text-gray-700">
                                Data da aprovação:
                            </span>
                            <span className="text-sm text-gray-700">
                                {formatDateTimeBR(baixa.data_aprovacao)}
                            </span>
                        </div>

                        {baixa.numero_processo_baixa && (
                            <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                                <span className="text-sm font-semibold text-gray-700">
                                    Número do Processo:
                                </span>
                                <span className="text-sm text-gray-700">
                                    {baixa.numero_processo_baixa}
                                </span>
                            </div>
                        )}

                        {baixa.numero_nbbpm && (
                            <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                                <span className="text-sm font-semibold text-gray-700">
                                    Número NBBPM:
                                </span>
                                <span className="text-sm text-gray-700">
                                    {baixa.numero_nbbpm}
                                </span>
                            </div>
                        )}

                        {baixa.data_baixa && (
                            <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                                <span className="text-sm font-semibold text-gray-700">
                                    Data da Baixa Física:
                                </span>
                                <span className="text-sm text-gray-700">
                                    {formatDateBR(baixa.data_baixa)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm font-bold text-[#2F7D57]">
                        Itens de Baixa Física
                    </p>

                    {/* Aviso do modo visualização para baixas Em elaboração */}
                    {isEmElaboracao && !modoEdicao && (
                        <p className="text-xs text-gray-500">
                            As informações estão em modo de visualização. Acione
                            &quot;Editar&quot; para alterar os itens desta Baixa Física.
                        </p>
                    )}

                    {/* Filtro — apenas no modo "Validar Baixa" */}
                    {isValidando && (
                        <div className="space-y-1 max-w-sm">
                            <Label htmlFor="filtro-validacao" className="text-sm font-semibold text-gray-700">
                                Filtro por Número Patrimonial ou Nome do Bem
                            </Label>
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                                <input
                                    id="filtro-validacao"
                                    type="text"
                                    value={filtroValidacao}
                                    onChange={(e) => setFiltroValidacao(e.target.value)}
                                    placeholder="Digite Número Patrimonial ou Nome do Bem"
                                    className="h-10 w-full rounded border border-gray-300 pl-9 pr-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#2F7D57] focus:border-[#2F7D57]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Contador de validação — modo "Validar Baixa" */}
                    {isValidando && baixa.itens.length > 0 && (
                        <p className="text-xs text-gray-500">
                            {checkedIds.size} de {baixa.itens.length} item(ns) validado(s)
                            {todosValidados && (
                                <span className="ml-2 text-[#2F7D57] font-semibold">
                                    Todos validados — aceite disponível
                                </span>
                            )}
                        </p>
                    )}

                    {/* Tabela — modo "Validar Baixa" */}
                    {isValidando && (
                        <ValidacaoTable
                            itens={itensFiltrados}
                            checkedIds={checkedIds}
                            onToggle={toggleCheck}
                        />
                    )}

                    {/* Lista editável — Em elaboração com a ação "Editar" acionada */}
                    {podeEditar && (
                        <div className="space-y-2">
                            {editRows.length === 0 && (
                                <p className="text-sm text-gray-400">Nenhum item vinculado</p>
                            )}
                            {editRows.map((row, idx) => (
                                <EditItemRow
                                    key={row.rowId}
                                    item={row.item}
                                    isLast={idx === editRows.length - 1}
                                    allSelectedIds={allSelectedEditIds}
                                    unidadeAdministrativa={ua.id}
                                    onSelect={(bem) => handleSelectBem(row.rowId, bem)}
                                    onClear={() => handleClearRow(row.rowId)}
                                    onRemove={() => handleRemoveRow(row.rowId)}
                                    onAdd={handleAddRow}
                                />
                            ))}
                        </div>
                    )}

                    {/* Lista somente leitura — Em elaboração (sem edição), aceita, recusada */}
                    {!podeEditar && !isValidando && (
                        <div className="space-y-2">
                            {(baixa.itens ?? []).length === 0 && (
                                <p className="text-sm text-gray-400">Nenhum item vinculado</p>
                            )}
                            {(baixa.itens ?? []).map((item) => (
                                <ReadOnlyItemRow key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showHistorico && baixa && (
                <HistoricoModal
                    baixaId={baixa.id}
                    onClose={() => setShowHistorico(false)}
                />
            )}

            {showConfirmarAceite && (
                <ConfirmarAceiteModal
                    onConfirm={handleConfirmarAceite}
                    onCancel={() => setShowConfirmarAceite(false)}
                    loading={aceitando}
                />
            )}

            {showRecusarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-800">Recusar Baixa Física</h2>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => { setShowRecusarModal(false); setMotivoRecusa("") }}
                                disabled={recusando}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Fechar"
                            >
                                <X size={16} />
                            </Button>
                        </div>
                        <div className="px-6 py-5 space-y-3">
                            <p className="text-sm text-gray-600">
                                Tem certeza que deseja recusar esta solicitação de Baixa Física?
                            </p>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="motivo-recusa" className="text-sm font-semibold text-gray-700">
                                    Motivo (opcional)
                                </Label>
                                <Textarea
                                    id="motivo-recusa"
                                    value={motivoRecusa}
                                    onChange={(e) => setMotivoRecusa(e.target.value)}
                                    disabled={recusando}
                                    rows={4}
                                    placeholder="Descreva o motivo da recusa..."
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <Button
                                type="button"
                                onClick={() => { setShowRecusarModal(false); setMotivoRecusa("") }}
                                disabled={recusando}
                                className="h-10 px-5 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleRecusar}
                                disabled={recusando}
                                className="h-10 px-5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                            >
                                {recusando ? "Recusando..." : "Confirmar Recusa"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
