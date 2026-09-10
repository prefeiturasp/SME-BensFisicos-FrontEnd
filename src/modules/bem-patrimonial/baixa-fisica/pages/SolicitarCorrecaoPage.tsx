import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import {
    solicitarCorrecaoSchema,
    type SolicitarCorrecaoFormData,
} from "../validators/baixa-form.schema"
import { baixaFisicaService } from "../service/baixas.service"
import type { BaixaFisicaDetail } from "../types/baixas-fisicas.types"

const ACTION_BUTTON_CLASS =
    "h-10 px-5 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors flex items-center gap-2 text-sm"

export default function SolicitarCorrecaoPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [baixa, setBaixa] = useState<BaixaFisicaDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showToast, setShowToast] = useState(false)

    const form = useForm<SolicitarCorrecaoFormData>({
        resolver: zodResolver(solicitarCorrecaoSchema),
        mode: "onSubmit",
        defaultValues: { motivo: "" },
    })

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

    const handleSolicitarCorrecao = form.handleSubmit(async (values) => {
        if (!baixa) return

        setSubmitting(true)
        try {
            await baixaFisicaService.solicitarCorrecao(baixa.id, { motivo: values.motivo })
            setShowToast(true)
            setTimeout(() => {
                navigate(-1)
            }, 1500)
        } catch (err) {
            console.error(err)
            form.setError("root.serverError", {
                message: err instanceof Error ? err.message : "Erro ao solicitar correção da baixa.",
            })
        } finally {
            setSubmitting(false)
        }
    })

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
        <Form {...form}>
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
                        disabled={submitting || showToast}
                        className={`h-10 px-5 font-semibold rounded-md flex items-center gap-2 text-sm transition-colors ${
                            showToast
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-[#2F7D57] text-white hover:bg-[#256947]"
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

            {form.formState.errors.root?.serverError?.message && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2" role="alert">
                    {form.formState.errors.root.serverError.message}
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
                    <FormField
                        control={form.control}
                        name="motivo"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel
                                    className="text-sm font-semibold text-gray-700"
                                    htmlFor="observacoes-correcao"
                                >
                                    Observações
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        id="observacoes-correcao"
                                        disabled={showToast}
                                        rows={6}
                                        placeholder="Descreva o que precisa ser corrigido..."
                                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
        </Form>
    )
}