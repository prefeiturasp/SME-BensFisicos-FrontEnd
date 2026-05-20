import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    ArrowLeft,
    History,
    Plus,
    Trash2,
    X,
    ChevronDown,
    Pencil,
    FileDown,
} from "lucide-react"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { bemService, type Bem } from "../../bem/services/bem.service"
import HistoricoModal from "../modals/HistoricoModal"
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

// ============================================================================
// HELPERS
// ============================================================================

function formatDateBR(dateString: string | null | undefined): string {
    if (!dateString) return "-"

    const date = new Date(dateString)

    if (isNaN(date.getTime())) return "-"

    return date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

function formatDateTimeBR(dateString: string | null | undefined): string {
    if (!dateString) return "-"

    const date = new Date(dateString)

    if (isNaN(date.getTime())) return "-"

    return date.toLocaleString("pt-BR")
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
        aguardando_aprovacao: "text-blue-700",
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
// BEM SELECTOR
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

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
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

        if (results.length === 0) {
            search("")
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value

        setInputValue(val)
        setOpen(true)

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            search(val)
        }, 300)
    }

    const handleSelect = (bem: Bem) => {
        onSelect(bem)
        setInputValue("")
        setOpen(false)
    }

    const renderDropdownContent = () => {
        if (loading) {
            return (
                <div className="px-3 py-2 text-sm text-gray-400">
                    Buscando...
                </div>
            )
        }

        if (results.length === 0) {
            return (
                <div className="px-3 py-2 text-sm text-gray-400">
                    Nenhum bem encontrado.
                </div>
            )
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
                    <span className="font-mono mr-2">
                        {bem.numero_patrimonial}
                    </span>
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
// ITEM ROW
// ============================================================================

interface ItemRowProps {
    readonly item: BaixaFisicaItem | null
    readonly isEditing: boolean
    readonly isLast: boolean
    readonly allSelectedIds: number[]
    readonly unidadeAdministrativa: number | string
    readonly onRemove: () => void
    readonly onAdd: () => void
    readonly onSelect: (bem: Bem) => void
    readonly onClear: () => void
}

function ItemRow({
    item,
    isEditing,
    isLast,
    allSelectedIds,
    unidadeAdministrativa,
    onRemove,
    onAdd,
    onSelect,
    onClear,
}: ItemRowProps) {
    return (
        <div
            className={`relative flex items-stretch border border-gray-300 rounded bg-white overflow-visible ${
                item ? "z-10" : "z-50"
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

            {isEditing && (
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
            )}
        </div>
    )
}

// ============================================================================
// PAGE
// ============================================================================

let nextRowId = 1

export default function VerBaixaPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [baixa, setBaixa] = useState<BaixaFisicaDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [editRows, setEditRows] = useState<EditRow[]>([])
    const [hasChanges, setHasChanges] = useState(false)

    const [showHistorico, setShowHistorico] = useState(false)

    useEffect(() => {
        const fetchBaixa = async () => {
            try {
                if (!id) return

                const data = await baixaFisicaService.retrieve(Number(id))

                setBaixa(data)

                setEditRows(
                    data.itens.length > 0
                        ? data.itens.map((i) => ({
                            rowId: nextRowId++,
                            item: i,
                        }))
                        : [
                            {
                                rowId: nextRowId++,
                                item: null,
                            },
                        ]
                )
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchBaixa()
    }, [id])

    const isEditing =
        baixa?.status !== "aceita" &&
        baixa?.status !== "recusada" &&
        baixa?.status !== "cancelada" &&
        baixa?.status !== "solicitada"

    const allSelectedIds = editRows
        .filter((r) => r.item)
        .map((r) => r.item!.bem.id)

    const handleSelectBem = (rowId: number, bem: Bem) => {
        const numeroPatrimonial =
            bem.numero_patrimonial ?? `SEM-NUMERO-${bem.id}`

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
            prev.map((r) =>
                r.rowId === rowId
                    ? {
                        ...r,
                        item: null,
                    }
                    : r
            )
        )

        setHasChanges(true)
    }

    const handleRemoveRow = (rowId: number) => {
        setEditRows((prev) => {
            const next = prev.filter((r) => r.rowId !== rowId)

            if (next.length === 0) {
                return [
                    {
                        rowId: nextRowId++,
                        item: null,
                    },
                ]
            }

            return next
        })

        setHasChanges(true)
    }

    const handleAddRow = () => {
        setEditRows((prev) => [
            ...prev,
            {
                rowId: nextRowId++,
                item: null,
            },
        ])
    }

    const handleSave = async () => {
        if (!baixa) return

        setSaving(true)

        try {
            const itens = editRows
                .filter((r) => r.item)
                .map((r) => ({
                    bem: r.item!.bem.id,
                }))

            const updated = await baixaFisicaService.update(baixa.id, {
                itens,
            })

            setBaixa(updated)

            setEditRows(
                updated.itens.length > 0
                    ? updated.itens.map((i) => ({
                        rowId: nextRowId++,
                        item: i,
                    }))
                    : [
                        {
                            rowId: nextRowId++,
                            item: null,
                        },
                    ]
            )

            setHasChanges(false)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

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
        }
    }

    if (loading) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Carregando...
            </div>
        )
    }

    if (!baixa) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Baixa não encontrada
            </div>
        )
    }

    const ua = baixa.unidade_administrativa_origem

    return (
        <div className="p-8 space-y-4">
            <AppBreadcrumb
                items={[
                    {
                        label: "Bem Patrimonial",
                    },
                    {
                        label: "Baixa Física de Bens Patrimoniais",
                    },
                    {
                        label: "Visualizar Baixa Física de Bem Patrimonial",
                        isActive: true,
                    },
                ]}
            />

            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-700">
                    Visualizar Baixa Física de Bem Patrimonial
                </h1>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={`h-10 px-5 font-semibold rounded-md flex items-center gap-2 text-sm transition-colors border ${hasChanges
                                ? "border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white bg-white"
                                : "border-gray-300 text-gray-400 bg-white cursor-not-allowed"
                                }`}
                        >
                            <Pencil size={14} />
                            {saving ? "Salvando..." : "Salvar Edição"}
                        </button>
                    ) : (
                        <button
                            disabled
                            className="h-10 px-5 border border-gray-300 text-gray-400 font-semibold rounded-md flex items-center gap-2 text-sm bg-white cursor-not-allowed"
                        >
                            <Pencil size={14} />
                            Salvar Edição
                        </button>
                    )}

                    {baixa.url_gerar_nbbpm && (
                        <button
                            onClick={handleGerarNbbpm}
                            className={ACTION_BUTTON_CLASS}
                        >
                            <FileDown size={14} />
                            Baixar NBBPM
                        </button>
                    )}

                    <button
                        onClick={() => setShowHistorico(true)}
                        className={ACTION_BUTTON_CLASS}
                    >
                        <History size={14} />
                        Histórico
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className={ACTION_BUTTON_CLASS}
                    >
                        <ArrowLeft size={14} />
                        Voltar
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md overflow-visible shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <span className="text-sm font-bold text-[#2F7D57]">
                        Baixa Física #{String(baixa.id).padStart(3, "0")} - UA:{" "}
                        {ua.codigo} - {ua.sigla}
                    </span>

                    <StatusBadge
                        status={baixa.status}
                        statusDisplay={baixa.status_display}
                    />
                </div>

                <div className="divide-y divide-gray-100">
                    <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                        <span className="text-sm font-semibold text-gray-700">
                            Data da Baixa Física:
                        </span>

                        <div>
                            <p className="text-sm text-gray-700">
                                {formatDateBR(baixa.data_baixa)}
                            </p>

                            <p className="text-xs text-gray-400">
                                Data informada no processo de baixa física
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                        <span className="text-sm font-semibold text-gray-700">
                            Número do Processo:
                        </span>

                        <span className="text-sm text-gray-700">
                            {baixa.numero_processo_baixa ?? "-"}
                        </span>
                    </div>

                    <div className="grid grid-cols-[200px_1fr] px-6 py-3 bg-[#FAFAFA]">
                        <span className="text-sm font-semibold text-gray-700">
                            Número NBBPM:
                        </span>

                        <span className="text-sm text-gray-700">
                            {baixa.numero_nbbpm ?? "-"}
                        </span>
                    </div>

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
                </div>

                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm font-bold text-[#2F7D57]">
                        Itens de Baixa Física
                    </p>

                    {editRows.length === 0 && (
                        <p className="text-sm text-gray-400">
                            Nenhum item vinculado
                        </p>
                    )}

                    {editRows.map((row, idx) => (
                        <ItemRow
                            key={row.rowId}
                            item={row.item}
                            isEditing={isEditing}
                            isLast={idx === editRows.length - 1}
                            allSelectedIds={allSelectedIds}
                            unidadeAdministrativa={ua.id}
                            onSelect={(bem) => handleSelectBem(row.rowId, bem)}
                            onClear={() => handleClearRow(row.rowId)}
                            onRemove={() => handleRemoveRow(row.rowId)}
                            onAdd={handleAddRow}
                        />
                    ))}
                </div>
            </div>

            {showHistorico && baixa && (
                <HistoricoModal
                    baixaId={baixa.id}
                    onClose={() => setShowHistorico(false)}
                />
            )}
        </div>
    )
}