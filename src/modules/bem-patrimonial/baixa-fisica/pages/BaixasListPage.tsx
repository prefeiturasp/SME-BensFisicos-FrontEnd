import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    baixaFisicaService,
} from "../service/baixas.service"
import type { BaixaFisica, BaixaFisicaListParams } from "../types/baixas-fisicas.types"
import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowUpDown, Eye, Search } from "lucide-react"
import { format } from "date-fns"
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker"

// ===================== CONSTANTES =====================

const ACTION_BUTTON_CLASS = `
h-10 px-6 bg-white border border-[#2F7D57]
text-[#2F7D57] hover:bg-[#2F7D57]
hover:text-white font-semibold rounded-md transition-colors
`

const INPUT_SEARCH_CLASS =
    "h-10 w-full border border-gray-300 rounded-xs pl-9 pr-3 text-sm text-gray-700 bg-white"

// ===================== HELPERS =====================

function formatDateTimeBR(dateString: string): string {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ""
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${day}/${month}/${year} - ${hours}:${minutes}`
}

// ===================== COMPONENTS =====================

interface StatusBadgeProps {
    readonly status: string
    readonly statusDisplay: string
}

function StatusBadge({ status, statusDisplay }: StatusBadgeProps) {
    const colorMap: Record<string, string> = {
        // "aguardando_envio" é exibido como "Em elaboração"
        aguardando_envio: "text-yellow-700",
        solicitada: "text-blue-700",
        aceita: "text-[#2F7D57]",
        recusada: "text-red-600",
        cancelada: "text-gray-500",
    }

    // O backend já retorna "Em elaboração" no status_display após a alteração
    // em constants.py, então usamos statusDisplay diretamente.
    const cls = colorMap[status] ?? "text-gray-600"
    return <span className={`text-xs font-medium ${cls}`}>{statusDisplay}</span>
}

// ===================== PAGE =====================

export default function BaixasListPage() {
    const [baixas, setBaixas] = useState<BaixaFisica[]>([])
    const [loading, setLoading] = useState(true)
    const [count, setCount] = useState(0)
    const [page, setPage] = useState(1)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [actionLoading, setActionLoading] = useState(false)

    const [searchInput, setSearchInput] = useState("")
    const [statusInput, setStatusInput] = useState("")
    const [dateRangeInput, setDateRangeInput] = useState<DateRange | undefined>()
    const [dateTypeAprovadas, setDateTypeAprovadas] = useState(false)
    const [dateTypeSolicitadas, setDateTypeSolicitadas] = useState(false)

    const [appliedFilters, setAppliedFilters] = useState<BaixaFisicaListParams>({
        ordering: "-data_criacao",
    })

    const totalPages = Math.ceil(count / 10)
    const navigate = useNavigate()

    const fetchBaixas = useCallback(async () => {
        setLoading(true)
        try {
            const res = await baixaFisicaService.list({ ...appliedFilters, page })
            setBaixas(res.results)
            setCount(res.count)
        } finally {
            setLoading(false)
        }
    }, [page, appliedFilters])

    useEffect(() => {
        fetchBaixas()
    }, [fetchBaixas])

    // ===================== SELECTION =====================

    // Status "aguardando_envio" agora é chamado "Em elaboração" na UI
    const emElaboracaoIds = baixas
        .filter(b => b.status === "aguardando_envio")
        .map(b => b.id)

    const solicitadaIds = baixas
        .filter(b => b.status === "solicitada")
        .map(b => b.id)

    // NOVO — Baixas com status Aprovado (ACEITA) selecionáveis para a
    // geração da NBBPM em lote. Só entram na seleção de "Selecionar
    // todas" quando não há nenhuma baixa em elaboração/solicitada na
    // página, para não misturar as duas ações em lote.
    const aceitaIds = new Set(
        baixas.filter(b => b.status === "aceita").map(b => b.id)
    )

    const allSelectableIds = [...emElaboracaoIds, ...solicitadaIds]

    const allSelected =
        allSelectableIds.length > 0 &&
        allSelectableIds.every(id => selectedIds.includes(id))

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([])
        } else {
            // Seleciona todas em elaboração, mas apenas a primeira solicitada
            const primeiraSolicitada = solicitadaIds.length > 0 ? [solicitadaIds[0]] : []
            setSelectedIds([...emElaboracaoIds, ...primeiraSolicitada])
        }
    }

    const toggleSelect = (id: number) => {
        const b = baixas.find(x => x.id === id)
        const isSolicitada = b?.status === "solicitada"

        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id)
            // Baixas "solicitada" só permitem 1 selecionada por vez
            if (isSolicitada) {
                const semSolicitadas = prev.filter(x => !solicitadaIds.includes(x))
                return [...semSolicitadas, id]
            }
            return [...prev, id]
        })
    }

    const selectedEmElaboracao = selectedIds.filter(id => emElaboracaoIds.includes(id))
    const selectedSolicitadas = selectedIds.filter(id => solicitadaIds.includes(id))
    const selectedAceitas = selectedIds.filter(id => aceitaIds.has(id))

    // ===================== HANDLERS =====================

    const handleSearch = () => {
        setPage(1)
        setSelectedIds([])

        const dateFrom = dateRangeInput?.from ? format(dateRangeInput.from, "yyyy-MM-dd") : undefined
        const dateTo = dateRangeInput?.to ? format(dateRangeInput.to, "yyyy-MM-dd") : undefined

        setAppliedFilters({
            ordering: appliedFilters.ordering,
            search: searchInput.trim() || undefined,
            status: statusInput || undefined,
            data_aprovacao__gte: dateTypeAprovadas ? dateFrom : undefined,
            data_aprovacao__lte: dateTypeAprovadas ? dateTo : undefined,
            data_criacao__gte: !dateTypeAprovadas || dateTypeSolicitadas ? dateFrom : undefined,
            data_criacao__lte: !dateTypeAprovadas || dateTypeSolicitadas ? dateTo : undefined,
        })
    }

    const handleOrdering = (field: string) => {
        const current = appliedFilters.ordering ?? ""
        const next = current === field ? `-${field}` : field
        setAppliedFilters(prev => ({ ...prev, ordering: next }))
    }

    const handleExportarExcel = async () => {
        try {
            const blob = await baixaFisicaService.exportarExcel({
                unidade_administrativa_origem: appliedFilters.unidade_administrativa_origem,
                status: appliedFilters.status,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "baixas-fisicas.xlsx"
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            alert("Erro ao exportar Excel")
        }
    }

    // Chama o endpoint /solicitar/ para baixas "Em elaboração" — fluxo do
    // solicitante, sem alteração.
    const handleSolicitar = async () => {
        if (selectedEmElaboracao.length === 0) return
        setActionLoading(true)
        try {
            await Promise.all(selectedEmElaboracao.map(id => baixaFisicaService.enviarSolicitacao(id)))
            setSelectedIds([])
            fetchBaixas()
        } catch {
            alert("Erro ao solicitar baixas.")
        } finally {
            setActionLoading(false)
        }
    }

    // "Aprovar"/"Recusar" são atalhos: levam à tela "Validar Baixa" da
    // primeira (e única, na prática) baixa selecionada, onde a revisão
    // item a item é obrigatória antes de qualquer decisão.
    const handleIrParaValidacao = () => {
        const [primeiraSelecionada] = selectedSolicitadas
        if (!primeiraSelecionada) return
        navigate(`/baixas-fisicas/${primeiraSelecionada}`)
    }

    // NOVO — leva para a tela de cadastro das informações básicas da
    // NBBPM consolidada, passando as Baixas Aprovadas selecionadas.
    const handleGerarNbbpm = () => {
        if (selectedAceitas.length === 0) return
        navigate("/baixas-fisicas/gerar-nbbpm", { state: { baixaIds: selectedAceitas } })
    }

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                        Carregando...
                    </td>
                </tr>
            )
        }
        if (baixas.length === 0) {
            return (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                        Nenhum resultado encontrado.
                    </td>
                </tr>
            )
        }
        return baixas.map((b) => {
            const isSelectable = b.status === "solicitada" || b.status === "aguardando_envio" || b.status === "aceita"
            const isChecked = selectedIds.includes(b.id)
            return (
                <tr
                    key={b.id}
                    className={`border-b hover:bg-gray-50 ${isChecked ? "bg-green-50" : ""}`}
                >
                    <td className="p-3">
                        {isSelectable ? (
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelect(b.id)}
                                className="accent-[#00703C] cursor-pointer"
                            />
                        ) : (
                            <input
                                type="checkbox"
                                disabled
                                className="opacity-30 cursor-not-allowed"
                            />
                        )}
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                        {b.unidade_administrativa_origem.sigla}
                    </td>
                    <td className="p-3">
                        <StatusBadge status={b.status} statusDisplay={b.status_display} />
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                        {b.criado_por.nome_completo}
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                        {formatDateTimeBR(b.data_criacao)}
                    </td>
                    <td className="p-3 text-center">
                        <Link to={`/baixas-fisicas/${b.id}`}>
                            <Button size="icon" variant="ghost" aria-label="Visualizar">
                                <Eye size={18} />
                            </Button>
                        </Link>
                    </td>
                </tr>
            )
        })
    }

    // ===================== RENDER =====================

    return (
        <div className="p-8 space-y-4">
            <AppBreadcrumb
                items={[
                    { label: "Bem Patrimonial" },
                    { label: "Baixa Física de Bens Patrimoniais", isActive: true },
                ]}
            />

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-700">
                    Baixa Física de Bens Patrimoniais
                </h1>
                <div className="flex gap-3 items-center">
                    <Button onClick={() => globalThis.history.back()} className={ACTION_BUTTON_CLASS}>
                        <ArrowLeft size={16} />
                    </Button>

                    {/* "Solicitar" — baixas "Em elaboração" selecionadas (fluxo do
                        solicitante, em lote, sem alteração) */}
                    {selectedEmElaboracao.length > 0 && (
                        <Button
                            onClick={handleSolicitar}
                            disabled={actionLoading}
                            className="h-10 px-6 bg-[#00703C] text-white font-semibold rounded-md hover:bg-[#005a30] transition-colors"
                        >
                            Solicitar ({selectedEmElaboracao.length})
                        </Button>
                    )}

                    {/* "Aprovar"/"Recusar" — atalho para a tela "Validar Baixa".
                        Como o destino é uma única baixa, ambos os botões levam
                        ao mesmo lugar: a primeira baixa "solicitada" selecionada. */}
                    {selectedSolicitadas.length > 0 && (
                        <>
                            <Button
                                onClick={handleIrParaValidacao}
                                className="h-10 px-6 bg-[#00703C] text-white font-semibold rounded-md hover:bg-[#005a30] transition-colors"
                                title="Abrir a tela de validação para aprovar"
                            >
                                Aprovar
                            </Button>
                            <Button
                                onClick={handleIrParaValidacao}
                                className="h-10 px-6 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                                title="Abrir a tela de validação para recusar/solicitar correção"
                            >
                                Recusar
                            </Button>
                        </>
                    )}

                    {/* NOVO — "Gerar NBBPM": disponível quando há Baixas com status
                        Aprovado selecionadas. Leva à tela de cadastro das
                        informações básicas da NBBPM consolidada. */}
                    {selectedAceitas.length > 0 && (
                        <Button
                            onClick={handleGerarNbbpm}
                            className="h-10 px-6 bg-[#00703C] text-white font-semibold rounded-md hover:bg-[#005a30] transition-colors"
                        >
                            Gerar NBBPM ({selectedAceitas.length})
                        </Button>
                    )}

                    <Button className={ACTION_BUTTON_CLASS} onClick={handleExportarExcel}>
                        Exportar Excel
                    </Button>
                    <Button className={ACTION_BUTTON_CLASS} onClick={() => navigate("/baixas-fisicas/novo")}>
                        Adicionar Baixa
                    </Button>
                </div>
            </div>

            {/* CARD */}
            <Card className="p-6">

                {/* FILTROS */}
                <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="search-bem" className="text-sm font-semibold text-gray-700">
                            Buscar por Número/Nome do Bem ou NBBPM
                        </label>
                        <div className="relative mt-1">
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                id="search-bem"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className={INPUT_SEARCH_CLASS}
                                placeholder="Nº patrimonial, nome do item, NBBPM"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="status-select" className="text-sm font-semibold text-gray-700">
                            Filtrar por status
                        </label>
                        <div className="relative mt-1">
                            <select
                                id="status-select"
                                value={statusInput}
                                onChange={(e) => setStatusInput(e.target.value)}
                                className="h-10 w-full border border-gray-300 rounded-xs px-3 text-sm text-gray-700 bg-white"
                            >
                                <option value="">Todos</option>
                                <option value="aceita">Aceita</option>
                                <option value="recusada">Recusada</option>
                                <option value="solicitada">Solicitada</option>
                                {/* Valor da API continua "aguardando_envio"; label atualizado */}
                                <option value="aguardando_envio">Em elaboração</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="date-range-picker" className="text-sm font-semibold text-gray-700">
                            Filtro por período
                        </label>
                        <div className="mt-1">
                            <DateRangePicker
                                id="date-range-picker"
                                value={dateRangeInput}
                                onChange={setDateRangeInput}
                                dateTypeAprovadas={dateTypeAprovadas}
                                dateTypeSolicitadas={dateTypeSolicitadas}
                                onDateTypeAprovadasChange={setDateTypeAprovadas}
                                onDateTypeSolicitadasChange={setDateTypeSolicitadas}
                            />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={handleSearch}
                            className="h-10 px-6 bg-[#00703C] text-white hover:bg-[#005a30]"
                        >
                            Filtrar
                        </Button>
                    </div>
                </div>

                {/* LABEL */}
                <p className="text-sm font-semibold text-green-700 mt-4">
                    Baixas Físicas Cadastradas
                </p>

                {/* TABELA */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#F5F5F5] border-b">
                            <tr className="text-left text-gray-600 font-semibold">
                                <th className="p-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        disabled={allSelectableIds.length === 0}
                                        className="accent-[#00703C] cursor-pointer"
                                    />
                                </th>
                                <th className="p-3 cursor-pointer" onClick={() => handleOrdering("unidade_administrativa_origem__sigla")}>
                                    <div className="flex gap-2 items-center">
                                        Unidade Administrativa <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th className="p-3">Status</th>
                                <th className="p-3 cursor-pointer" onClick={() => handleOrdering("criado_por__nome_completo")}>
                                    <div className="flex gap-2 items-center">
                                        Usuário que solicitou a Baixa <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th className="p-3 cursor-pointer" onClick={() => handleOrdering("data_criacao")}>
                                    <div className="flex gap-2 items-center">
                                        Atualização <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th className="p-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableBody()}
                        </tbody>
                    </table>
                </div>

                {/* PAGINAÇÃO */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Anterior
                        </Button>
                        <span className="text-sm text-gray-600">
                            Página {page} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Próxima
                        </Button>
                    </div>
                )}

            </Card>
        </div>
    )
}