// pages/GerarNBBPMPage.tsx
//
// NOVO — Tela de cadastro das informações básicas necessárias à emissão
// da NBBPM consolidada. Aberta a partir da ação "Gerar NBBPM" na
// listagem de Baixas Físicas, com as Baixas Aprovadas selecionadas
// recebidas via router state (`{ baixaIds: number[] }`).

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    gerarNbbpmSchema,
    type GerarNbbpmFormData,
} from "../validators/baixa-form.schema"
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

    const [submitting, setSubmitting] = useState(false)

    const form = useForm<GerarNbbpmFormData>({
        resolver: zodResolver(gerarNbbpmSchema),
        mode: "onSubmit",
        defaultValues: {
            numero_processo: "",
            data_autorizacao: "",
            responsavel: "",
            numero_processo_destinacao_final: "",
        },
    })

    const handleCancelar = () => {
        navigate(-1)
    }

    const handleGerarBaixa = form.handleSubmit(async (values) => {
        if (baixaIds.length === 0) {
            form.setError("root.serverError", {
                message: "Nenhuma Baixa Física aprovada foi selecionada.",
            })
            return
        }

        setSubmitting(true)
        try {
            const blob = await baixaFisicaService.gerarNbbpmLote({
                baixas: baixaIds,
                numero_processo_baixa: values.numero_processo,
                data_autorizacao: values.data_autorizacao,
                responsavel: values.responsavel,
                numero_processo_destinacao_final:
                    values.numero_processo_destinacao_final?.trim() || undefined,
            })
            downloadBlob(blob, `NBBPM_${values.numero_processo}.pdf`)
            navigate(-1)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao gerar NBBPM."
            form.setError("root.serverError", { message })
        } finally {
            setSubmitting(false)
        }
    })

    return (
        <Form {...form}>
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

            {form.formState.errors.root?.serverError?.message && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2" role="alert">
                    {form.formState.errors.root.serverError.message}
                </div>
            )}

            {baixaIds.length === 0 && !form.formState.errors.root?.serverError && (
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
                    <FormField
                        control={form.control}
                        name="numero_processo"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-2">
                                <FormLabel className="text-sm font-semibold text-gray-700" htmlFor="numero-processo-baixa">
                                    Número do processo de Baixa *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        id="numero-processo-baixa"
                                        placeholder="Ex.: 6016.2025/0117371-7"
                                        className={INPUT_CLASS}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="data_autorizacao"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-2">
                                <FormLabel className="text-sm font-semibold text-gray-700" htmlFor="data-autorizacao">
                                    Data da Autorização *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        id="data-autorizacao"
                                        type="date"
                                        placeholder=""
                                        className={INPUT_CLASS}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="responsavel"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-2">
                                <FormLabel className="text-sm font-semibold text-gray-700" htmlFor="responsavel">
                                    Responsável *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        id="responsavel"
                                        placeholder="Nome do responsável"
                                        className={INPUT_CLASS}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="numero_processo_destinacao_final"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-2">
                                <FormLabel className="text-sm font-semibold text-gray-700" htmlFor="numero-processo-destinacao-final">
                                    Número do processo de destinação final
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        id="numero-processo-destinacao-final"
                                        placeholder="Opcional"
                                        className={INPUT_CLASS}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

            </Card>
        </div>
        </Form>
    )
}