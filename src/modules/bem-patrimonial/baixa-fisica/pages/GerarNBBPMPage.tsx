// pages/GerarNBBPMPage.tsx
//
// NOVO — Tela de cadastro das informações básicas necessárias à emissão
// da NBBPM consolidada. Aberta a partir da ação "Gerar NBBPM" na
// listagem de Baixas Físicas, com as Baixas Aprovadas selecionadas
// recebidas via router state (`{ baixaIds: number[] }`).

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { baixaFisicaService, downloadBlob } from "../service/baixas.service"

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

const INPUT_CLASS =
    "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"

interface LocationState {
    baixaIds?: number[]
}

export default function GerarNBBPMPage() {
    const navigate = useNavigate()
    const location = useLocation()

    const baixaIds = (location.state as LocationState | null)?.baixaIds ?? []

    const [numeroProcessoBaixa, setNumeroProcessoBaixa] = useState("")
    const [dataAutorizacao, setDataAutorizacao] = useState("")
    const [responsavel, setResponsavel] = useState("")
    const [numeroProcessoDestinacaoFinal, setNumeroProcessoDestinacaoFinal] = useState("")

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCancelar = () => {
        navigate(-1)
    }

    const handleGerarBaixa = async () => {
        setError(null)

        if (baixaIds.length === 0) {
            setError("Nenhuma Baixa Física aprovada foi selecionada.")
            return
        }
        if (!numeroProcessoBaixa.trim()) {
            setError("Informe o número do processo de Baixa.")
            return
        }
        if (!dataAutorizacao) {
            setError("Informe a data da autorização.")
            return
        }
        if (!responsavel.trim()) {
            setError("Informe o responsável.")
            return
        }

        setSubmitting(true)
        try {
            const blob = await baixaFisicaService.gerarNbbpmLote({
                baixas: baixaIds,
                numero_processo_baixa: numeroProcessoBaixa.trim(),
                data_autorizacao: dataAutorizacao,
                responsavel: responsavel.trim(),
                numero_processo_destinacao_final: numeroProcessoDestinacaoFinal.trim() || undefined,
            })
            downloadBlob(blob, `NBBPM_${numeroProcessoBaixa.trim()}.pdf`)
            navigate(-1)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao gerar NBBPM."
            setError(message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-8 space-y-4">

            <AppBreadcrumb
                items={[
                    { label: "Bem Patrimonial" },
                    { label: "Baixa Física de Bens Patrimoniais" },
                    { label: "Gerar NBBPM", isActive: true },
                ]}
            />

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-700">
                    Gerar NBBPM
                </h1>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleGerarBaixa}
                        disabled={submitting || baixaIds.length === 0}
                        className="h-10 px-6 bg-[#2F7D57] text-white font-semibold rounded-md hover:bg-[#256947]"
                    >
                        {submitting ? "Gerando..." : "Gerar Baixa"}
                    </Button>
                    <Button onClick={handleCancelar} className={ACTION_BUTTON_CLASS}>
                        <ArrowLeft size={18} />
                        Cancelar
                    </Button>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2" role="alert">
                    {error}
                </div>
            )}

            {baixaIds.length === 0 && !error && (
                <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-4 py-2" role="alert">
                    Nenhuma Baixa Física aceita foi selecionada. Volte para a listagem e
                    selecione ao menos uma Baixa com status Aceita.
                </div>
            )}

            <Card className="p-6 space-y-6">

                <p className="text-sm font-semibold text-green-700">
                    {baixaIds.length} Baixa(s) Física(s) selecionada(s)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="numero-processo-baixa" className="text-sm font-semibold text-gray-700">
                            Número do processo de Baixa *
                        </label>
                        <input
                            id="numero-processo-baixa"
                            value={numeroProcessoBaixa}
                            onChange={(e) => setNumeroProcessoBaixa(e.target.value)}
                            placeholder="Ex.: 6016.2025/0117371-7"
                            className={INPUT_CLASS}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="data-autorizacao" className="text-sm font-semibold text-gray-700">
                            Data da Autorização *
                        </label>
                        <input
                            id="data-autorizacao"
                            type="date"
                            value={dataAutorizacao}
                            onChange={(e) => setDataAutorizacao(e.target.value)}
                            className={INPUT_CLASS}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="responsavel" className="text-sm font-semibold text-gray-700">
                            Responsável *
                        </label>
                        <input
                            id="responsavel"
                            value={responsavel}
                            onChange={(e) => setResponsavel(e.target.value)}
                            placeholder="Nome do responsável"
                            className={INPUT_CLASS}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="numero-processo-destinacao-final" className="text-sm font-semibold text-gray-700">
                            Número do processo de destinação final
                        </label>
                        <input
                            id="numero-processo-destinacao-final"
                            value={numeroProcessoDestinacaoFinal}
                            onChange={(e) => setNumeroProcessoDestinacaoFinal(e.target.value)}
                            placeholder="Opcional"
                            className={INPUT_CLASS}
                        />
                    </div>
                </div>

            </Card>
        </div>
    )
}
