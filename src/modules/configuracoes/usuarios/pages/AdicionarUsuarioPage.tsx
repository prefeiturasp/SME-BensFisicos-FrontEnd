import { ArrowLeft, Settings, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
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

import { z } from "zod"
import { adicionarUsuarioSchema } from "../validators/adicionarUsuario"

import { usuarioService } from "../service/usuario.service"
import { authService, type EscopoUa } from "../../../../auth/auth.service"

type FormData = z.infer<typeof adicionarUsuarioSchema>

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

export default function AdicionarUsuarioPage() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<EscopoUa[]>([])
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<EscopoUa | null>(null)

  // UO do próprio gestor logado — usada quando Gestor não seleciona UA
  const [gestorUoId, setGestorUoId] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(adicionarUsuarioSchema),
    defaultValues: {
      status: "ativo",
      unidade: "",
      grupo: "",
    },
  })

  const grupoSelecionado = watch("grupo")
  const unidadeObrigatoria = grupoSelecionado === "OPERADOR_INVENTARIO"

  useEffect(() => {
    const carregarUnidadesDoEscopo = async () => {
      try {
        const { data: me } = await authService.getCurrentUser()

        const uas: EscopoUa[] =
          me.opcoes_escopo?.grupos.flatMap(grupo => grupo.uas) ?? []

        setUnidadesAdministrativas(uas)

        // Guarda a UO do usuário logado para usar quando Gestor não selecionar UA
        if (me.uo_ativa) {
          setGestorUoId(me.uo_ativa.id)
        }

      } catch (error) {
        console.error("Erro ao carregar unidades do escopo", error)
      }
    }

    carregarUnidadesDoEscopo()
  }, [])

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      setErrorMessage(null)

      const payload = {
        username: data.username,
        nome: data.nome,
        email: data.email,
        rf: data.rf,
        // UA: apenas se selecionada (obrigatória para Operador, opcional para Gestor)
        unidade_administrativa: unidadeSelecionada?.unidade_administrativa_id ?? null,
        // UO: vem da UA se selecionada, senão usa a UO do próprio gestor logado
        unidade_orcamentaria: unidadeSelecionada?.unidade_orcamentaria_id ?? gestorUoId,
        group_name: data.grupo,
        password: data.password,
        password_confirm: data.confirmPassword,
        is_active: data.status === "ativo",
      }

      await usuarioService.create(payload)

      navigate("/usuarios")

    } catch (error: any) {

      if (error?.response?.data) {
        setErrorMessage("Erro de validação ao criar usuário")
      } else {
        setErrorMessage(error.message ?? "Erro ao criar usuário")
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-4">

      <AppBreadcrumb
        items={[
          { label: "Configurações", icon: Settings },
          { label: "Usuários" },
          { label: "Adicionar Usuário", isActive: true },
        ]}
      />

      <div className="flex items-center justify-between">

        <h1 className="text-xl font-bold tracking-tight text-gray-700">
          Adicionar Usuário
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
            disabled={loading}
            className="h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>

          <Button
            onClick={() => navigate("/usuarios")}
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

      <Card className="p-6 space-y-6 h-[calc(70vh-75px)]">

        <form className="grid grid-cols-1 md:grid-cols-3 gap-6">

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
              <span className="text-red-600 text-sm">
                {errors.nome.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              RF{REQUIRED}
            </label>

            <input
              type="text"
              placeholder="Digite o rf"
              className={INPUT_TEXT_CLASS}
              {...register("rf")}
            />

            {errors.rf && (
              <span className="text-red-600 text-sm">
                {errors.rf.message}
              </span>
            )}
          </div>

          {/* Grupo — vem antes de Unidade para que o asterisco reflita a escolha */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Grupo de Permissionamento{REQUIRED}
            </label>

            <Select
              onValueChange={(value) => {
                setValue("grupo", value, { shouldValidate: true })
                // Limpa a unidade ao trocar o grupo para forçar nova seleção
                setValue("unidade", "", { shouldValidate: false })
                setUnidadeSelecionada(null)
              }}
            >
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue placeholder="Selecione os grupos" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="GESTOR_PATRIMONIO">
                  Gestor
                </SelectItem>
                <SelectItem value="OPERADOR_INVENTARIO">
                  Operador
                </SelectItem>
              </SelectContent>
            </Select>

            {errors.grupo && (
              <span className="text-red-600 text-sm">
                {errors.grupo.message}
              </span>
            )}
          </div>

          {/* Unidade — asterisco condicional: obrigatória apenas para Operador */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Unidade Administrativa
              {unidadeObrigatoria ? REQUIRED : null}
            </label>

            <Select
              onValueChange={(value) => {
                const ua = unidadesAdministrativas.find(
                  u => String(u.unidade_administrativa_id) === value
                )
                setUnidadeSelecionada(ua ?? null)
                setValue("unidade", value, { shouldValidate: true })
              }}
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
              <span className="text-red-600 text-sm">
                {errors.unidade.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Nome de Usuário de Acesso

              <input
                type="text"
                placeholder="Digite o nome de usuário de acesso"
                className={INPUT_TEXT_CLASS}
                {...register("username")}
              />
            </label>

            {errors.username && (
              <span className="text-red-600 text-sm">
                {errors.username.message}
              </span>
            )}
          </div>

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
              <span className="text-red-600 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-gray-700">
              Cadastre uma Senha

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Cadastre uma senha"
                  className={INPUT_TEXT_CLASS}
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

              </div>
            </label>

            {errors.password && (
              <span className="text-red-600 text-sm">
                {errors.password.message}
              </span>
            )}

          </div>

          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-gray-700">
              Confirme a Senha

              <div className="relative">

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme a senha"
                  className={INPUT_TEXT_CLASS}
                  {...register("confirmPassword")}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>
            </label>

            {errors.confirmPassword && (
              <span className="text-red-600 text-sm">
                {errors.confirmPassword.message}
              </span>
            )}

          </div>

          <div className="flex flex-col gap-2">

            <label className="text-sm font-semibold text-gray-700">
              Status

              <Select
                defaultValue="ativo"
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>

              </Select>
            </label>

          </div>

        </form>

      </Card>
    </div>
  )
}