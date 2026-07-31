import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { adicionarUsuarioSchema } from "../validators/adicionarUsuario"
import { usuarioService } from "../service/usuario.service"
import { authService, type EscopoGrupo, type EscopoUa } from "../../../../auth/auth.service"
import {
  API_FIELD_PASSWORD_CONFIRM,
  ACTION_BUTTON_CLASS,
  PasswordStatusSection,
  UserTopSection,
  buildToggleTodasHandler,
  buildGrupoChangeHandler,
  applyApiFieldErrors,
  buildFieldMap,
  useUsuarioFormState,
} from "./usuarioFormShared"

type FormData = z.infer<typeof adicionarUsuarioSchema>

export default function AdicionarUsuarioPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<EscopoUa[]>([])
  const [gruposEscopo, setGruposEscopo] = useState<EscopoGrupo[]>([])
  const [uoSelecionadaId, setUoSelecionadaId] = useState<number | null>(null)
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<EscopoUa[]>([])
  const [filtroUa, setFiltroUa] = useState("")
  const [todasUnidades, setTodasUnidades] = useState(false)
  const [gestorUoId, setGestorUoId] = useState<number | null>(null)

  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(adicionarUsuarioSchema) as Resolver<FormData>,
    defaultValues: { status: "ativo", unidade: [], grupo: "" },
  })

  const grupoSelecionado = watch("grupo")
  const unidadeObrigatoria = grupoSelecionado === "OPERADOR_INVENTARIO"

  useEffect(() => {
    const carregar = async () => {
      const { data: me } = await authService.getCurrentUser()
      const grupos = (me.opcoes_escopo?.grupos ?? []).filter((g) => g?.uo?.id)
      setGruposEscopo(grupos)
      setUoSelecionadaId(null)
      setUnidadesAdministrativas([])
      if (me.uo_ativa) setGestorUoId(me.uo_ativa.id)
    }
    carregar().catch((error) => console.error("Erro ao carregar unidades do escopo", error))
  }, [])

  const {
    idsSelecionados,
    uosDisponiveis,
    unidadesListadas,
    syncFormUnidades,
    toggleUa,
  } = useUsuarioFormState({
    gruposEscopo,
    uoSelecionadaId,
    unidadesAdministrativas,
    unidadesSelecionadas,
    filtroUa,
    todasUnidades,
    setUnidadesAdministrativas,
    setUnidadesSelecionadas,
    setFiltroUa,
    setTodasUnidades,
    setValue,
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const isGestor = data.grupo === "GESTOR_PATRIMONIO"
      const enviarTodasUas = isGestor && todasUnidades
      const unidadesParaEnvio = enviarTodasUas ? unidadesAdministrativas : unidadesSelecionadas

      let unidadeOrcamentaria: number | null = null
      let unidadesAdministrativasIds: number[] = []
      const unidadeAdministrativaPadrao = unidadesParaEnvio[0]?.unidade_administrativa_id ?? null

      if (isGestor && !enviarTodasUas && unidadesParaEnvio.length === 0) {
        unidadeOrcamentaria = uoSelecionadaId ?? gestorUoId ?? null
      } else {
        unidadeOrcamentaria = unidadesParaEnvio[0]?.unidade_orcamentaria_id ?? uoSelecionadaId ?? gestorUoId ?? null
        unidadesAdministrativasIds = unidadesParaEnvio.map((ua) => ua.unidade_administrativa_id)
      }

      await usuarioService.create({
        username: data.username,
        nome: data.nome,
        email: data.email,
        rf: data.rf,
        unidade_administrativa: unidadeAdministrativaPadrao,
        unidade_orcamentaria: unidadeOrcamentaria,
        unidades_administrativas: unidadesAdministrativasIds,
        group_name: data.grupo,
        password: data.password,
        [API_FIELD_PASSWORD_CONFIRM]: data.confirmPassword,
        is_active: data.status === "ativo",
      })
      navigate("/usuarios")
    } catch (error: any) {
      const apiErrors = error?.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        const fieldMap = buildFieldMap<FormData>("password", "confirmPassword", "unidade")
        const hasFieldError = applyApiFieldErrors<FormData>(apiErrors, fieldMap, setError)
        setErrorMessage(hasFieldError ? "Corrija os campos destacados." : "Erro de validação ao criar usuário")
      } else {
        setErrorMessage(error.message ?? "Erro ao criar usuário")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-4">
      <AppBreadcrumb items={[{ label: "Usuários", to: "/usuarios" }, { label: "Adicionar Usuário", isActive: true }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-700">Adicionar Usuário</h1>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => navigate("/usuarios")} className={ACTION_BUTTON_CLASS}><ArrowLeft size={18} /></Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={loading} className="h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md">{loading ? "Salvando..." : "Salvar"}</Button>
          <Button onClick={() => navigate("/usuarios")} className={ACTION_BUTTON_CLASS}>Cancelar</Button>
        </div>
      </div>
      {errorMessage && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{errorMessage}</div>}
      <Card className="p-6 space-y-6">
        <UserTopSection
          nomeValue={watch("nome")}
          rfValue={watch("rf")}
          usernameValue={watch("username")}
          emailValue={watch("email")}
          grupoValue={watch("grupo")}
          statusValue={watch("status")}
          uoSelecionadaId={uoSelecionadaId}
          uosDisponiveis={uosDisponiveis}
          unidadeObrigatoria={unidadeObrigatoria}
          unidadesListadas={unidadesListadas}
          idsSelecionados={idsSelecionados}
          todasUnidades={todasUnidades}
          filtroUa={filtroUa}
          unidadeError={errors.unidade?.message}
          disableUaSelector={!uoSelecionadaId}
          onNomeChange={(event) => setValue("nome", event.target.value, { shouldValidate: true })}
          onRfChange={(event) => setValue("rf", event.target.value, { shouldValidate: true })}
          onUsernameChange={(event) => setValue("username", event.target.value, { shouldValidate: true })}
          onEmailChange={(event) => setValue("email", event.target.value, { shouldValidate: true })}
          onGrupoChange={buildGrupoChangeHandler(
            setValue,
            setUnidadesSelecionadas,
            syncFormUnidades,
            setTodasUnidades
          )}
          onStatusChange={(value) => setValue("status", value)}
          onUoChange={setUoSelecionadaId}
          onFiltroUaChange={setFiltroUa}
          onToggleTodasUnidades={buildToggleTodasHandler(
            grupoSelecionado,
            setTodasUnidades,
            setUnidadesSelecionadas,
            syncFormUnidades,
            setFiltroUa,
            unidadesAdministrativas
          )}
          onToggleUa={toggleUa}
        />
        <PasswordStatusSection
          senhaId="password"
          confirmarSenhaId="confirmPassword"
          senhaField={register("password")}
          confirmarSenhaField={register("confirmPassword")}
          showSenha={showPassword}
          showConfirmarSenha={showConfirmPassword}
          onToggleSenha={() => setShowPassword((v) => !v)}
          onToggleConfirmarSenha={() => setShowConfirmPassword((v) => !v)}
          senhaError={errors.password?.message}
          confirmarSenhaError={errors.confirmPassword?.message}
        />
      </Card>
    </div>
  )
}
