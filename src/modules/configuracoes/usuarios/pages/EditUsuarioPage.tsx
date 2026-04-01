import { ArrowLeft, Settings, Eye, EyeOff } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { usuarioService } from "../service/usuario.service"
import { authService, type EscopoUa } from "../../../../auth/auth.service"
import { type EditarUsuarioFormData, editarUsuarioSchema } from "../validators/editarUsuario"

//
// ─── STYLES ───────────────────────────────────────────────────────────────
//

const INPUT_CLASS =
    "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center"

const INPUT_TEXT_CLASS =
    "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

const REQUIRED = <span className="text-red-500 ml-1">*</span>

//
// ─── TIPOS ────────────────────────────────────────────────────────────────
//

interface ValoresOriginais {
    nome: string
    rf: string
    email: string
    grupo: string
    status: string
    unidade_administrativa_id: number | null
    unidade_orcamentaria_id: number | null
}

//
// ─── COMPONENT ─────────────────────────────────────────────────────────────
//

export default function EditarUsuarioPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<EscopoUa[]>([])
    const [unidadeSelecionada, setUnidadeSelecionada] = useState<EscopoUa | null>(null)

    const [loadingDados, setLoadingDados] = useState(true)
    const [loadingSalvar, setLoadingSalvar] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Guarda os valores originais carregados da API para comparação no PATCH
    const [valoresOriginais, setValoresOriginais] = useState<ValoresOriginais | null>(null)

    // Controle de visibilidade dos campos de senha
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditarUsuarioFormData>({
        resolver: zodResolver(editarUsuarioSchema),
        defaultValues: {
            nome: "",
            rf: "",
            email: "",
            unidade: "",
            grupo: "",
            status: "ativo",
            senha: "",
            confirmarSenha: "",
        },
    })

    const grupoSelecionado = watch("grupo")
    const statusSelecionado = watch("status")
    const unidadeObrigatoria = grupoSelecionado === "OPERADOR_INVENTARIO"

    //
    // ─── LOAD ───────────────────────────────────────────────────────────────
    //

    useEffect(() => {
        const carregar = async () => {
            if (!id) return

            try {
                setLoadingDados(true)

                const [dadosUsuario, { data: me }] = await Promise.all([
                    usuarioService.retrieve(Number(id)),
                    authService.getCurrentUser(),
                ])

                setValue("nome", dadosUsuario.nome ?? "")
                setValue("rf", dadosUsuario.rf ?? "")
                setValue("email", dadosUsuario.email ?? "")
                setValue("grupo", dadosUsuario.grupo_nome ?? "")
                setValue("status", dadosUsuario.status ?? "ativo")

                const uas: EscopoUa[] =
                    me.opcoes_escopo?.grupos.flatMap(g => g.uas) ?? []

                setUnidadesAdministrativas(uas)

                let uaSelecionada: EscopoUa | null = null

                if (dadosUsuario.unidade_codigo) {
                    const uaAtual = uas.find(
                        u => u.codigo === dadosUsuario.unidade_codigo
                    )
                    if (uaAtual) {
                        uaSelecionada = uaAtual
                        setUnidadeSelecionada(uaAtual)
                        setValue("unidade", String(uaAtual.unidade_administrativa_id))
                    }
                }

                // Salva snapshot dos valores originais para uso no PATCH
                setValoresOriginais({
                    nome: dadosUsuario.nome ?? "",
                    rf: dadosUsuario.rf ?? "",
                    email: dadosUsuario.email ?? "",
                    grupo: dadosUsuario.grupo_nome ?? "",
                    status: dadosUsuario.status ?? "ativo",
                    unidade_administrativa_id: uaSelecionada?.unidade_administrativa_id ?? null,
                    unidade_orcamentaria_id: uaSelecionada?.unidade_orcamentaria_id ?? null,
                })

            } catch {
                setErrorMessage("Erro ao carregar os dados do usuário.")
            } finally {
                setLoadingDados(false)
            }
        }

        carregar()
    }, [id, setValue])

    //
    // ─── SUBMIT ─────────────────────────────────────────────────────────────
    //

    const onSubmit = async (data: EditarUsuarioFormData) => {
        if (!id) return

        try {
            setLoadingSalvar(true)
            setErrorMessage(null)

            const uaAtualId = unidadeSelecionada?.unidade_administrativa_id ?? null
            const uaAtualOrcId = unidadeSelecionada?.unidade_orcamentaria_id ?? null

            // Monta o payload apenas com os campos que foram alterados
            const payload: Record<string, unknown> = {}

            if (data.nome !== valoresOriginais?.nome)
                payload.nome = data.nome

            if (data.rf !== valoresOriginais?.rf)
                payload.rf = data.rf

            if (data.email !== valoresOriginais?.email)
                payload.email = data.email

            if (data.grupo !== valoresOriginais?.grupo)
                payload.group_name = data.grupo

            const isActiveAtual = data.status === "ativo"
            const isActiveOriginal = valoresOriginais?.status === "ativo"
            if (isActiveAtual !== isActiveOriginal)
                payload.is_active = isActiveAtual

            if (uaAtualId !== valoresOriginais?.unidade_administrativa_id)
                payload.unidade_administrativa = uaAtualId

            if (uaAtualOrcId !== valoresOriginais?.unidade_orcamentaria_id)
                payload.unidade_orcamentaria = uaAtualOrcId

            if (data.senha) {
                payload.password = data.senha
                payload.password_confirm = data.confirmarSenha
            }

            await usuarioService.partialUpdate(Number(id), payload)

            navigate(`/usuarios/${id}`)

        } catch (error) {
            console.error("Erro ao salvar usuário:", error)
            setErrorMessage("Erro ao salvar usuário.")
        } finally {
            setLoadingSalvar(false)
        }
    }

    //
    // ─── RENDER ─────────────────────────────────────────────────────────────
    //

    if (loadingDados) {
        return (
            <div className="p-8 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Carregando...</span>
            </div>
        )
    }

    const handleUnidadeChange = (value: string) => {
        const ua = unidadesAdministrativas.find(
            (u) => String(u.unidade_administrativa_id) === value
        )

        setUnidadeSelecionada(ua ?? null)
        setValue("unidade", value, { shouldValidate: true })
    }

    return (
        <div className="p-8 space-y-4">

            <AppBreadcrumb
                items={[
                    { label: "Configurações", icon: Settings },
                    { label: "Usuários" },
                    { label: "Editar Usuário", isActive: true },
                ]}
            />

            <div className="flex items-center justify-between">

                <h1 className="text-xl font-bold tracking-tight text-gray-700">
                    Editar Usuário
                </h1>

                <div className="flex items-center gap-3">

                    <Button
                        type="button"
                        onClick={() => navigate(-1)}
                        className={ACTION_BUTTON_CLASS}
                    >
                        <ArrowLeft size={18} />
                    </Button>

                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={loadingSalvar}
                        className="h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md font-semibold"
                    >
                        {loadingSalvar ? "Salvando..." : "Salvar"}
                    </Button>

                    <Button
                        onClick={() => navigate(`/usuarios`)}
                        className={ACTION_BUTTON_CLASS}
                    >
                        Cancelar
                    </Button>

                </div>
            </div>

            {errorMessage && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">
                    {errorMessage}
                </div>
            )}

            <Card className="p-6 space-y-6">

                <form className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <input {...register("unidade")} type="hidden" />

                    {/* Nome */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Nome Completo{REQUIRED}
                        </label>
                        <input
                            {...register("nome")}
                            className={INPUT_TEXT_CLASS}
                            placeholder="Digite o nome completo"
                        />
                        {errors.nome && <span className="text-red-600 text-sm">{errors.nome.message}</span>}
                    </div>

                    {/* RF */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            RF{REQUIRED}
                        </label>
                        <input
                            {...register("rf")}
                            className={INPUT_TEXT_CLASS}
                            placeholder="Digite o rf"
                        />
                        {errors.rf && <span className="text-red-600 text-sm">{errors.rf.message}</span>}
                    </div>

                    {/* Grupo */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Grupo{REQUIRED}
                        </label>
                        <Select
                            value={grupoSelecionado}
                            onValueChange={(value) => {
                                setValue("grupo", value, { shouldValidate: true })
                                setValue("unidade", "")
                                setUnidadeSelecionada(null)
                            }}
                        >
                            <SelectTrigger className={INPUT_CLASS}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GESTOR_PATRIMONIO">Gestor</SelectItem>
                                <SelectItem value="OPERADOR_INVENTARIO">Operador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Unidade */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Unidade {unidadeObrigatoria && REQUIRED}
                        </label>
                        <Select
                            value={unidadeSelecionada ? String(unidadeSelecionada.unidade_administrativa_id) : undefined}
                            onValueChange={handleUnidadeChange}
                        >
                            <SelectTrigger className={INPUT_CLASS}>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {unidadesAdministrativas.map(ua => (
                                    <SelectItem
                                        key={ua.unidade_administrativa_id}
                                        value={String(ua.unidade_administrativa_id)}
                                    >
                                        {ua.codigo} - {ua.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.unidade && <span className="text-red-600 text-sm">{errors.unidade.message}</span>}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            E-mail{REQUIRED}
                        </label>
                        <input
                            {...register("email")}
                            className={INPUT_TEXT_CLASS}
                            placeholder="Digite o e-mail"
                        />
                        {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Status{REQUIRED}
                        </label>
                        <Select
                            value={statusSelecionado}
                            onValueChange={(v) => setValue("status", v, { shouldValidate: true })}
                        >
                            <SelectTrigger className={INPUT_CLASS}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </form>

                {/* Senha */}
                <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Cadastre uma Senha
                        
                        <div className="relative">
                            <input
                                type={mostrarSenha ? "text" : "password"}
                                placeholder="Cadastre uma senha"
                                {...register("senha")}
                                className={`${INPUT_TEXT_CLASS} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarSenha(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                tabIndex={-1}
                                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.senha && (
                            <span className="text-red-600 text-sm">{errors.senha.message}</span>
                        )}
                        </label>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Confirme a Senha
                        
                        <div className="relative">
                            <input
                                type={mostrarConfirmarSenha ? "text" : "password"}
                                placeholder="Confirme a senha"
                                {...register("confirmarSenha")}
                                className={`${INPUT_TEXT_CLASS} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarConfirmarSenha(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                tabIndex={-1}
                                aria-label={mostrarConfirmarSenha ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                            >
                                {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.confirmarSenha && (
                            <span className="text-red-600 text-sm">{errors.confirmarSenha.message}</span>
                        )}
                        </label>
                    </div>

                </div>

            </Card>
        </div>
    )
}