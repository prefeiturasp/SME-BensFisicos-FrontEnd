import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { baixaFisicaService } from "../service/baixas.service"
import type { BaixaFisicaDetail } from "../types/baixas-fisicas.types"

const ACTION_BUTTON_CLASS =
    "h-10 px-5 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors flex items-center gap-2 text-sm"

export default function SolicitarCorrecaoPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [baixa, setBaixa] = useState<BaixaFisicaDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [motivo, setMotivo] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showToast, setShowToast] = useState(false)

    useEffect(() => {
        const fetchBaixa = async () => {
            try {
                if (!id) return
                const data = await baixaFisicaService.retrieve(Number(id))
                setBaixa(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchBaixa()
    }, [id])

    const handleSolicitarCorrecao = async () => {
        if (!baixa) return
        if (!motivo.trim()) {
            setError("Descreva as orientações para a correção antes de enviar.")
            return
        }

        setSubmitting(true)
        setError(null)
        try {
            await baixaFisicaService.solicitarCorrecao(baixa.id, { motivo: motivo.trim() })
            setShowToast(true)
            setTimeout(() => {
                navigate(-1)
            }, 1500)
        } catch (err) {
            console.error(err)
            setError(
                err instanceof Error ? err.message : "Erro ao solicitar correção da baixa."
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleVoltar = () => {
        navigate(-1)
    }

    if (loading) {
        return <div className="p-8 text-sm text-gray-500">Carregando...</div>
    }

    if (!baixa) {
        return <div className="p-8 text-sm text-gray-500">Baixa não encontrada</div>
    }

    const ua = baixa.unidade_administrativa_origem

    return (
        <div className="p-8 space-y-4">
            <AppBreadcrumb
                items={[
                    { label: "Bem Patrimonial" },
                    { label: "Baixa Física de Bens Patrimoniais" },
                    { label: "Solicitar correção", isActive: true },
                ]}
            />

            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-700">
                    Solicitar correção
                </h1>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSolicitarCorrecao}
                        disabled={submitting || !motivo.trim() || showToast}
                        className={`h-10 px-5 font-semibold rounded-md flex items-center gap-2 text-sm transition-colors ${
                            motivo.trim() && !showToast
                                ? "bg-[#2F7D57] text-white hover:bg-[#256947]"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {submitting ? "Enviando..." : "Solicitar correção"}
                    </button>
                    <button onClick={handleVoltar} className={ACTION_BUTTON_CLASS}>
                        <ArrowLeft size={14} />
                        Voltar
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2" role="alert">
                    {error}
                </div>
            )}

            {showToast && (
                <output className="block text-sm text-green-700 bg-green-50 border border-green-200 rounded px-4 py-2">
                    Correção solicitada com sucesso! Redirecionando...
                </output>
            )}

            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
                {/* Unidade Administrativa (somente leitura) */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Unidade Administrativa
                    
                    <div className="h-11 w-full max-w-md rounded border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-400">
                        {ua.codigo} - {ua.nome}
                    </div>
                    </label>
                </div>

                {/* Observações */}
                <div className="px-6 py-5 space-y-2 border-b border-gray-200">
                    <p className="text-sm font-bold text-[#2F7D57]">
                        Solicitar correção
                    </p>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="observacoes-correcao" className="text-sm font-semibold text-gray-700">
                            Observações
                        </label>
                        <textarea
                            id="observacoes-correcao"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            disabled={showToast}
                            rows={6}
                            placeholder="Descreva o que precisa ser corrigido..."
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-[#2F7D57] focus:border-[#2F7D57] disabled:bg-gray-50 disabled:text-gray-400"
                        />
                    </div>
                </div>

                {/* Itens — somente leitura, sem checkboxes */}
                <div className="px-6 py-5 space-y-2">
                    <p className="text-sm font-bold text-[#2F7D57]">
                        Itens de Baixa Física
                    </p>
                    <div className="space-y-2">
                        {baixa.itens.length === 0 && (
                            <p className="text-sm text-gray-400">Nenhum item vinculado</p>
                        )}
                        {baixa.itens.map((item) => (
                            <div
                                key={item.id}
                                className="border border-gray-300 rounded bg-white px-4 py-2.5 text-sm text-gray-700"
                            >
                                <span className="font-mono mr-2">{item.bem.numero_patrimonial}</span>
                                {item.bem.nome || item.bem.descricao}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}