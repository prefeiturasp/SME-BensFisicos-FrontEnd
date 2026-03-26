import { ArrowLeft, Settings } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

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
import { z } from "zod"

import { usuarioService, type Usuario } from "../service/usuario.service"
import { authService, type EscopoUa } from "../../../../auth/auth.service"

// ─── Schema ───────────────────────────────────────────────────────────────────

const senhaSchema = z
    .string()
    .optional()
    .refine(
        (val) => !val || val.length >= 6,
        { message: "A senha deve ter no mínimo 6 caracteres" }
    )
    .refine(
        (val) => !val || /[A-Z]/.test(val),
        { message: "A senha deve conter pelo menos 1 letra maiúscula" }
    )
    .refine(
        (val) => !val || /[a-z]/.test(val),
        { message: "A senha deve conter pelo menos 1 letra minúscula" }
    )
    .refine(
        (val) => !val || /\d/.test(val),
        { message: "A senha deve conter pelo menos 1 número" }
    )
    .refine(
        (val) => !val || /[^A-Za-z0-9]/.test(val),
        { message: "A senha deve conter pelo menos 1 caractere especial" }
    )

const editarUsuarioSchema = z
    .object({
        nome: z.string().min(1, "Nome é obrigatório"),
        rf: z.string().min(1, "RF é obrigatório"),
        email: z.email("E-mail inválido"),
        unidade: z.string(),
        grupo: z.string().min(1, "Selecione um grupo"),
        status: z.string().min(1, "Selecione um status"),
        is_superuser: z.boolean().optional(),
        senha: senhaSchema,
        confirmarSenha: z.string().optional(),
    })
    .refine(
        (data) => !data.senha || data.senha === data.confirmarSenha,
        {
            message: "As senhas não coincidem",
            path: ["confirmarSenha"],
        }
    )

type FormData = z.infer<typeof editarUsuarioSchema>

// ─── Constantes de estilo ─────────────────────────────────────────────────────

const INPUT_CLASS =
    "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center"

const INPUT_TEXT_CLASS =
    "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"

const INPUT_READONLY_CLASS =
    "h-11 w-full rounded-xs border border-gray-200 px-4 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

const REQUIRED = <span className="text-red-500 ml-1">*</span>

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EditarUsuarioPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<EscopoUa[]>([])
    const [unidadeSelecionada, setUnidadeSelecionada] = useState<EscopoUa | null>(null)
    const [isSuperuser, setIsSuperuser] = useState(false)
    const [currentUserIsSuperuser, setCurrentUserIsSuperuser] = useState(false)

    const [loadingDados, setLoadingDados] = useState(true)
    const [loadingSalvar, setLoadingSalvar] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(editarUsuarioSchema),
        defaultValues: {
            nome: "",
            rf: "",
            email: "",
            unidade: "",
            grupo: "",
            status: "ativo",
            is_superuser: false,
            senha: "",
            confirmarSenha: "",
        },
    })

    const grupoSelecionado = watch("grupo")
    const unidadeObrigatoria = grupoSelecionado === "OPERADOR_INVENTARIO"

    // ── Carregamento inicial ───────────────────────────────────────────────────

    useEffect(() => {
        const carregar = async () => {
            if (!id) return

            try {
                setLoadingDados(true)

                const [dadosUsuario, { data: me }] = await Promise.all([
                    usuarioService.retrieve(Number(id)),
                    authService.getCurrentUser(),
                ])

                setUsuario(dadosUsuario)
                setCurrentUserIsSuperuser(false)

                // Preenche o formulário com os dados do usuário
                setValue("nome", dadosUsuario.nome ?? "")
                setValue("rf", dadosUsuario.rf ?? "")
                setValue("email", dadosUsuario.email ?? "")
                setValue("grupo", dadosUsuario.grupo_nome ?? "")
                setValue("status", dadosUsuario.status ?? "ativo")

                // Carrega UAs do escopo
                const uas: EscopoUa[] =
                    me.opcoes_escopo?.grupos.flatMap(g => g.uas) ?? []

                setUnidadesAdministrativas(uas)

                // Pré-seleciona a UA atual do usuário se existir
                if (dadosUsuario.unidade_codigo) {
                    const uaAtual = uas.find(
                        u => u.codigo === dadosUsuario.unidade_codigo
                    )
                    if (uaAtual) {
                        setUnidadeSelecionada(uaAtual)
                        setValue("unidade", String(uaAtual.unidade_administrativa_id))
                    }
                }

            } catch {
                setErrorMessage("Erro ao carregar os dados do usuário.")
            } finally {
                setLoadingDados(false)
            }
        }

        carregar()
    }, [id, setValue])

    // ── Submissão ─────────────────────────────────────────────────────────────

    const onSubmit = async (data: FormData) => {
        if (!id) return

        try {
            setLoadingSalvar(true)
            setErrorMessage(null)

            const payload: Record<string, unknown> = {
                nome: data.nome,
                rf: data.rf,
                email: data.email,
                group_name: data.grupo,
                is_active: data.status === "ativo",
                unidade_administrativa: unidadeSelecionada?.unidade_administrativa_id ?? null,
                unidade_orcamentaria: unidadeSelecionada?.unidade_orcamentaria_id ?? null,
            }

            // Inclui senha no payload apenas se foi preenchida
            if (data.senha) {
                payload.password = data.senha
                payload.password_confirm = data.confirmarSenha
            }

            // is_superuser apenas para superusuários
            if (currentUserIsSuperuser) {
                payload.is_superuser = isSuperuser
            }

            await usuarioService.partialUpdate(Number(id), payload)

            navigate(`/usuarios/${id}`)

        } catch (error: any) {

            if (error?.response?.data) {
                setErrorMessage("Erro de validação ao salvar usuário.")
            } else {
                setErrorMessage(error.message ?? "Erro ao salvar usuário.")
            }

        } finally {
            setLoadingSalvar(false)
        }
    }

    // ── Loading ────────────────────────────────────────────────────────────────

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

    // ── Render ─────────────────────────────────────────────────────────────────

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

                    {/* Nome Completo — editável */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Nome Completo{REQUIRED}
                        </label>
                        <input
                            type="text"
                            placeholder="Digite o nome completo"
                            className={INPUT_TEXT_CLASS}
                            {...register("nome")}
                        />
                        {errors.nome && (
                            <span className="text-red-600 text-sm">{errors.nome.message}</span>
                        )}
                    </div>

                    {/* RF — editável */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            RF{REQUIRED}
                        </label>
                        <input
                            type="text"
                            placeholder="Digite o RF"
                            className={INPUT_TEXT_CLASS}
                            {...register("rf")}
                        />
                        {errors.rf && (
                            <span className="text-red-600 text-sm">{errors.rf.message}</span>
                        )}
                    </div>

                    {/* Nome de Acesso — readonly */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Nome de Usuário de Acesso
                            {/*  */}
                            <input
                                type="text"
                                readOnly
                                value={usuario?.username ?? "—"}
                                className={INPUT_READONLY_CLASS}
                                title="Este campo não pode ser editado"
                            />
                            <span className="text-xs text-gray-400">
                                O nome de acesso não pode ser alterado.
                            </span>
                        </label>
                    </div>

                    {/* Grupo — editável, vem antes de Unidade */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Grupo de Permissionamento{REQUIRED}
                        </label>
                        <Select
                            value={grupoSelecionado}
                            onValueChange={(value) => {
                                setValue("grupo", value, { shouldValidate: true })
                                setValue("unidade", "", { shouldValidate: false })
                                setUnidadeSelecionada(null)
                            }}
                        >
                            <SelectTrigger className={INPUT_CLASS}>
                                <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GESTOR_PATRIMONIO">Gestor</SelectItem>
                                <SelectItem value="OPERADOR_INVENTARIO">Operador</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.grupo && (
                            <span className="text-red-600 text-sm">{errors.grupo.message}</span>
                        )}
                    </div>

                    {/* Unidade Administrativa — editável, asterisco condicional */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Unidade Administrativa
                            {unidadeObrigatoria ? REQUIRED : null}
                        </label>
                        <Select
                            value={unidadeSelecionada
                                ? String(unidadeSelecionada.unidade_administrativa_id)
                                : ""
                            }
                            onValueChange={handleUnidadeChange}
                        >
                            <SelectTrigger className={INPUT_CLASS}>
                                <SelectValue placeholder="Selecione uma UA" />
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
                        {errors.unidade && (
                            <span className="text-red-600 text-sm">{errors.unidade.message}</span>
                        )}
                    </div>

                    {/* E-mail — editável */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            E-mail do Usuário{REQUIRED}
                        </label>
                        <input
                            type="email"
                            placeholder="Digite o e-mail"
                            className={INPUT_TEXT_CLASS}
                            {...register("email")}
                        />
                        {errors.email && (
                            <span className="text-red-600 text-sm">{errors.email.message}</span>
                        )}
                    </div>

                    {/* Status — editável */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Status{REQUIRED}
                        </label>
                        <Select
                            value={watch("status")}
                            onValueChange={(value) => setValue("status", value, { shouldValidate: true })}
                        >
                            <SelectTrigger className={INPUT_CLASS}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <span className="text-red-600 text-sm">{errors.status.message}</span>
                        )}
                    </div>

                    {/* É Superusuário? — visível apenas para superusuários */}
                    {currentUserIsSuperuser && (
                        <div className="flex flex-col gap-2 justify-center">
                            <p className="text-sm font-semibold text-gray-700">
                                Permissões Especiais
                            </p>
                            <div className="flex items-center gap-3 h-11">
                                <Checkbox
                                    id="is_superuser"
                                    checked={isSuperuser}
                                    onCheckedChange={(checked: any) => setIsSuperuser(Boolean(checked))}
                                />
                                <label
                                    htmlFor="is_superuser"
                                    className="text-sm text-gray-700 cursor-pointer select-none"
                                >
                                    É Superusuário?
                                </label>
                            </div>
                        </div>
                    )}

                </form>

                {/* Seção de redefinição de senha */}
                <div className="border-t pt-6">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                        Redefinição de Senha
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                        Preencha apenas se deseja alterar a senha. Deixe em branco para manter a senha atual.
                    </p>

                    {/* Requisitos da senha */}
                    <ul className="text-xs text-gray-400 mb-4 list-disc list-inside space-y-0.5">
                        <li>Mínimo de 6 caracteres</li>
                        <li>Pelo menos 1 letra maiúscula</li>
                        <li>Pelo menos 1 letra minúscula</li>
                        <li>Pelo menos 1 número</li>
                        <li>Pelo menos 1 caractere especial (ex: @, #, !, $)</li>
                    </ul>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nova Senha */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Cadastre uma Nova Senha
                                {/*  */}
                                <input
                                    type="password"
                                    placeholder="Digite a nova senha"
                                    className={INPUT_TEXT_CLASS}
                                    {...register("senha")}
                                />
                                {errors.senha && (
                                    <span className="text-red-600 text-sm">{errors.senha.message}</span>
                                )}
                            </label>
                        </div>

                        {/* Confirmar Senha */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Confirme a Nova Senha
                                {/*  */}
                                <input
                                    type="password"
                                    placeholder="Confirme a nova senha"
                                    className={INPUT_TEXT_CLASS}
                                    {...register("confirmarSenha")}
                                />
                                {errors.confirmarSenha && (
                                    <span className="text-red-600 text-sm">{errors.confirmarSenha.message}</span>
                                )}
                            </label>
                        </div>

                    </div>
                </div>

            </Card>
        </div>
    )
}