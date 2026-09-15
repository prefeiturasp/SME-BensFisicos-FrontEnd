import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/auth/useAuth"
import { extractErrorMessage } from "@/lib/backend-form-errors"
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

const LABEL_CLASS = "text-sm font-semibold text-gray-700"

interface LocationState {
    baixaIds?: number[]
    processo?: string
}

function getMensagemErroNbbpm(err: unknown, fallback = "Erro ao gerar NBBPM."): string {
    if (err instanceof AxiosError) {
        const data = err.response?.data as Record<string, unknown> | undefined
        if (data && typeof data === "object") {
            const mensagem =
                extractErrorMessage(data.baixas) ??
                extractErrorMessage(data.numero_processo_baixa) ??
                extractErrorMessage(data.detail)
            if (mensagem) return mensagem
        }
    }
    if (err instanceof Error && err.message) return err.message
    return fallback
}

export default function GerarNBBPMPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()

    const baixaIds = (location.state as LocationState | null)?.baixaIds ?? []
    const processoState = (location.state as LocationState | null)?.processo ?? ""

    const [submitting, setSubmitting] = useState(false)

    const form = useForm<GerarNbbpmFormData>({
        resolver: zodResolver(gerarNbbpmSchema),
        mode: "onSubmit",
        defaultValues: {
            // O número do processo vem da listagem e é apenas exibido (readOnly),
            // mas continua no formulário para ser validado e enviado no payload.
            numero_processo: processoState,
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
            const nbbpm = await baixaFisicaService.gerarNbbpmLote({
                baixas: baixaIds,
                numero_processo_baixa: values.numero_processo,
                data_autorizacao: values.data_autorizacao,
                responsavel: values.responsavel,
                numero_processo_destinacao_final:
                    values.numero_processo_destinacao_final?.trim() || "",
            })

            try {
                const pdf = await baixaFisicaService.baixarNbbpmPdf(nbbpm.id)
                downloadBlob(pdf, `NBBPM_${nbbpm.numero ?? values.numero_processo}.pdf`)
            } catch (pdfErr) {
                toast.error(getMensagemErroNbbpm(pdfErr, "Erro ao baixar NBBPM."))
            }

            toast.success(
                nbbpm?.numero ? `NBBPM ${nbbpm.numero} gerada com sucesso!` : "NBBPM gerada com sucesso!"
            )
            navigate(-1)
        } catch (err: unknown) {
            const message = getMensagemErroNbbpm(err)
            form.setError("root.serverError", { message })
            toast.error(message)
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
                    <Button onClick={handleCancelar} className={ACTION_BUTTON_CLASS}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGerarBaixa}
                        disabled={submitting || baixaIds.length === 0}
                        className="h-10 px-6 bg-[#2F7D57] text-white font-semibold rounded-md transition-colors hover:bg-[#256947] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Gerando..." : "Gerar Baixa"}
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
                                <FormLabel className={LABEL_CLASS} htmlFor="numero-processo-baixa">
                                    Número do processo de Baixa *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        id="numero-processo-baixa"
                                        placeholder="Ex.: 6016.2025/0117371-7"
                                        readOnly
                                        className={`${INPUT_CLASS} bg-gray-50`}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/*
                      Gerado por é apenas informativo: mostra o RF do usuário logado
                      e não é enviado no payload, por isso fica fora do formulário.
                    */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="gerado-por" className={LABEL_CLASS}>
                            Gerado por
                        </Label>
                        <Input
                            id="gerado-por"
                            value={user?.rf ?? ""}
                            readOnly
                            disabled
                            placeholder="RF do usuário logado"
                            className={`${INPUT_CLASS} bg-gray-50 disabled:opacity-100`}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="data_autorizacao"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-2">
                                <FormLabel className={LABEL_CLASS} htmlFor="data-autorizacao">
                                    Data da Autorização *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        id="data-autorizacao"
                                        type="date"
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
                                <FormLabel className={LABEL_CLASS} htmlFor="responsavel">
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
                                <FormLabel className={LABEL_CLASS} htmlFor="numero-processo-destinacao-final">
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