import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { bemService } from "../services/bem.service"

type Props = Readonly<{
    bemId: number
    open: boolean
    onClose: () => void
}>

const FIELD_LABELS: Record<string, string> = {
    status: "Status",
    unidade_administrativa: "Unidade Administrativa",
    numero_patrimonial: "Número Patrimonial",
    localizacao: "Localização",
    bloqueado_conciliacao: "Bloqueado para Conciliação",
}

const STATUS_LABELS: Record<string, string> = {
    aguardando_aprovacao: "Aguardando aprovação",
    aprovado: "Aprovado",
    nao_aprovado: "Não aprovado",
    bloqueado: "Bloqueado para movimentação",
    baixa_fisica_aguardando_aprovacao: "Baixa Física - Aguardando aprovação",
    baixa_fisica: "Baixa Física",
}

export default function HistoricoModal({ bemId, open, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    const [historico, setHistorico] = useState<any[]>([])
    const [selecionado, setSelecionado] = useState<number>(0)

    function formatFieldName(field: string) {
        if (FIELD_LABELS[field]) return FIELD_LABELS[field]

        // fallback automático (transforma snake_case em Título)
        return field
            .replaceAll("_", " ")
            .replace(/\b\w/g, l => l.toUpperCase())
    }

    function translateValue(field: string, value: any) {
        if (value === null || value === undefined || value === "")
            return "-"

        // Boolean
        if (value === "True" || value === true) return "Sim"
        if (value === "False" || value === false) return "Não"

        // Status do Bem
        if (field === "status" && STATUS_LABELS[value])
            return STATUS_LABELS[value]

        return value
    }

    useEffect(() => {
        if (!open) return

        async function load() {
            setLoading(true)
            try {
                const data = await bemService.getHistorico(bemId)
                setHistorico(data)
                setSelecionado(0)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [open, bemId])

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-[#F9FAFB] w-[980px] h-[640px] rounded-xl shadow-2xl flex flex-col">

                {/* HEADER */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        Histórico
                    </h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-black">
                        <X size={22} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex flex-1 overflow-hidden">

                    {/* LEFT COLUMN */}
                    <div className="w-[340px] bg-white border-r border-gray-200 flex flex-col">

                        <div className="px-6 py-4 text-sm font-semibold text-gray-600 border-b">
                            Usuário
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">

                            {historico.map((item, index) => {
                                const ativo = selecionado === index
                                return (
                                    <button
                                        type="button"
                                        key={`${item.alterado_em}-${item.alterado_por_nome}`}
                                        onClick={() => setSelecionado(index)}
                                        className={`w-full text-left rounded-xl p-4 transition-all border
                                            ${ativo
                                                ? "bg-[#1F2937] text-white border-[#1F2937]"
                                                : "bg-gray-100 hover:bg-gray-200 border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                                                {item.alterado_por_nome?.charAt(0) ?? "S"}
                                            </div>

                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">
                                                    {item.alterado_por_nome ?? "Sistema"}
                                                </div>
                                                <div className={`text-xs ${ativo ? "text-gray-300" : "text-gray-500"}`}>
                                                    {new Date(item.alterado_em).toLocaleString()}
                                                </div>
                                            </div>

                                        </div>
                                    </button>
                                )
                            })}

                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex-1 p-8 overflow-y-auto">

                        <div className="text-sm font-semibold text-gray-600 mb-4">
                            Ações
                        </div>

                        {loading && (
                            <div className="text-gray-500 text-sm">
                                Carregando histórico...
                            </div>
                        )}

                        {!loading && historico[selecionado] && (
                            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6">

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">

                                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                                            {historico[selecionado].alterado_por_nome?.charAt(0) ?? "S"}
                                        </div>

                                        <div>
                                            <div className="font-semibold text-gray-800">
                                                Usuário: {historico[selecionado].alterado_por_nome}
                                            </div>
                                        </div>

                                    </div>

                                    <div className="text-sm text-gray-500">
                                        {new Date(historico[selecionado].alterado_em).toLocaleString()}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {historico[selecionado].acoes.map((acao: any) => (
                                        <div key={`${acao.campo}-${acao.valor_novo}`} className="text-sm">

                                            <div className="font-semibold text-gray-800 mb-1">
                                                {formatFieldName(acao.campo)}
                                            </div>

                                            <div className="text-gray-600">
                                                De: {translateValue(acao.campo, acao.valor_antigo)}
                                            </div>

                                            <div className="text-green-600 font-medium">
                                                Para: {translateValue(acao.campo, acao.valor_novo)}
                                            </div>

                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    )
}