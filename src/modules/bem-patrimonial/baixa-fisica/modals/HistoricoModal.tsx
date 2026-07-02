import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { baixaFisicaService } from "../service/baixas.service"
import type { HistoricoEntry } from '../types/baixas-fisicas.types'

// ============================================================================
// HELPERS
// ============================================================================

function formatDateTimeBR(iso: string): { date: string; time: string } {
    const d = new Date(iso)
    const date = d.toLocaleDateString("pt-BR")
    const time = d.toLocaleTimeString("pt-BR")
    return { date, time }
}

function getInitial(name: string | null): string {
    return (name ?? "?")[0].toUpperCase()
}

interface GroupEntry {
    key: string
    user: string | null
    date: string
    time: string
    items: HistoricoEntry[]
}

function groupByUser(entries: HistoricoEntry[]): GroupEntry[] {
    const groups: GroupEntry[] = []

    for (const entry of entries) {
        const { date, time } = formatDateTimeBR(entry.data_alteracao)
        const key = `${entry.alterado_por ?? "?"}__${date}__${time}`
        const existing = groups.find(g => g.key === key)
        if (existing) {
            existing.items.push(entry)
        } else {
            groups.push({ key, user: entry.alterado_por, date, time, items: [entry] })
        }
    }

    return groups
}

function getGroupLabel(items: HistoricoEntry[]): string {
    const campos = new Set(items.map(i => i.campo))
    if (campos.has("status") && items.some(i => i.campo === "status" && i.valor_novo === "Aceita")) return "Cadastro aceito"
    if (campos.has("status") && items.some(i => i.campo === "status" && i.valor_novo === "Solicitada")) return "Solicitação enviada"
    if (campos.has("status") && items.some(i => i.campo === "status" && i.valor_novo === "Recusada")) return "Cadastro recusado"
    if (campos.has("status") && items.some(i => i.campo === "status" && i.valor_novo === "Cancelada")) return "Cadastro cancelado"
    if (items.some(i => i.justificativa?.toLowerCase().includes("cadastro"))) return "Cadastro realizado"
    return "Cadastro alterado"
}

// ============================================================================
// MODAL
// ============================================================================

interface HistoricoModalProps {
    readonly baixaId: number
    readonly onClose: () => void
}

function HistoricoModal({ baixaId, onClose }: HistoricoModalProps) {
    const [entries, setEntries] = useState<HistoricoEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedKey, setSelectedKey] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await baixaFisicaService.historico(baixaId)
                setEntries(data)
                if (data.length > 0) {
                    const groups = groupByUser(data)
                    setSelectedKey(groups[0].key)
                }
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [baixaId])

    const groups = groupByUser(entries)
    const selectedGroup = groups.find(g => g.key === selectedKey)

    // Fix 1: Extrair o conteúdo do modal para evitar ternário aninhado
    const renderContent = () => {
        if (loading) {
            return <div className="p-8 text-sm text-gray-400 text-center">Carregando...</div>
        }
        if (entries.length === 0) {
            return <div className="p-8 text-sm text-gray-400 text-center">Nenhum histórico encontrado.</div>
        }
        return (
            <div className="flex divide-x divide-gray-200 min-h-[400px] max-h-[70vh]">

                {/* Coluna esquerda — lista de grupos */}
                <div className="w-[40%] overflow-y-auto py-4 px-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-500 px-2 mb-3">Usuário</p>
                    {groups.map(g => {
                        const isSelected = g.key === selectedKey
                        const label = getGroupLabel(g.items)
                        const selectedCls = isSelected
                            ? "bg-gray-800 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        const dateCls = isSelected ? "text-gray-300" : "text-gray-400"

                        return (
                            <button
                                key={g.key}
                                type="button"
                                onClick={() => setSelectedKey(g.key)}
                                className={`w-full text-left rounded-md px-4 py-3 flex items-start gap-3 transition-colors ${selectedCls}`}
                            >
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 bg-[#2F7D57] text-white">
                                    {getInitial(g.user)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm leading-tight">{label}</p>
                                    <p className={`text-xs mt-0.5 ${dateCls}`}>
                                        Usuário: {g.user ?? "-"}
                                    </p>
                                </div>

                                <div className={`text-right text-xs shrink-0 ${dateCls}`}>
                                    <p>{g.date}</p>
                                    <p>{g.time}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Coluna direita — detalhe */}
                <div className="flex-1 overflow-y-auto py-4 px-6">
                    <p className="text-sm font-semibold text-gray-500 mb-4">Ações</p>

                    {selectedGroup && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-200">
                                <div className="w-8 h-8 rounded-full bg-[#2F7D57] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                    {getInitial(selectedGroup.user)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">Usuário: {selectedGroup.user ?? "-"}</p>
                                </div>
                                <div className="text-xs text-gray-400 text-right">
                                    <p>{selectedGroup.date}</p>
                                    <p>{selectedGroup.time}</p>
                                </div>
                            </div>

                            <div className="px-4 py-4 space-y-2">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Ações:</p>
                                {selectedGroup.items.map(item => {
                                    const text = item.justificativa ?? `Campo "${item.campo}": ${item.valor_antigo ?? "vazio"} → ${item.valor_novo ?? "vazio"}`
                                    return (
                                        <p key={item.id} className="text-sm text-gray-600">
                                            {text}
                                        </p>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Fix 2: Usar <dialog> nativo em vez de div com role="dialog"
    // Fix 3: Remover onClick/onKeyDown do elemento não-interativo interno
    return (
        <dialog
            open
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 m-0 p-0 max-w-none max-h-none w-full h-full border-none"
            aria-label="Histórico"
            onClose={onClose}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Histórico</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Fechar histórico"
                    >
                        <X size={22} />
                    </button>
                </div>

                {renderContent()}
            </div>
        </dialog>
    )
}

export default HistoricoModal