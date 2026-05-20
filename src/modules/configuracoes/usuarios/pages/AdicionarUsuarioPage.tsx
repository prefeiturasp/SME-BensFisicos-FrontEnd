import { ArrowLeft, Eye, EyeOff, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { adicionarUsuarioSchema } from "../validators/adicionarUsuario"
import { usuarioService } from "../service/usuario.service"
import { authService, type EscopoGrupo, type EscopoUa } from "../../../../auth/auth.service"
import { UnidadesAdministrativasSelector } from "../components/UnidadesAdministrativasSelector"

type FormData = z.infer<typeof adicionarUsuarioSchema>

const INPUT_CLASS = "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center"
const INPUT_TEXT_CLASS = "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"
const ACTION_BUTTON_CLASS = "h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors"
const REQUIRED = <span className="text-red-500 ml-1">*</span>

function getSelecionadasEfetivas(
  selecionadas: EscopoUa[],
  grupo: string,
  todasDaUo: EscopoUa[]
) {
  if (selecionadas.length > 0) return selecionadas
  if (grupo === "GESTOR_PATRIMONIO") return todasDaUo
  return []
}

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
  const [somenteSelecionadas, setSomenteSelecionadas] = useState(false)
  const [gestorUoId, setGestorUoId] = useState<number | null>(null)

  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(adicionarUsuarioSchema),
    defaultValues: { status: "ativo", unidade: [], grupo: "" },
  })

  const grupoSelecionado = watch("grupo")
  const unidadeObrigatoria = grupoSelecionado === "OPERADOR_INVENTARIO"

  useEffect(() => {
    if (unidadesSelecionadas.length === 0 && somenteSelecionadas) setSomenteSelecionadas(false)
  }, [somenteSelecionadas, unidadesSelecionadas.length])

  useEffect(() => {
    const carregar = async () => {
      const { data: me } = await authService.getCurrentUser()
      const grupos = (me.opcoes_escopo?.grupos ?? []).filter((g) => g?.uo?.id)
      setGruposEscopo(grupos)
      const uoInicialId = me.uo_ativa?.id ?? grupos[0]?.uo.id ?? null
      setUoSelecionadaId(uoInicialId)
      const grupoInicial = grupos.find((g) => g.uo.id === uoInicialId)
      setUnidadesAdministrativas(grupoInicial?.uas ?? [])
      if (me.uo_ativa) setGestorUoId(me.uo_ativa.id)
    }
    carregar().catch((error) => console.error("Erro ao carregar unidades do escopo", error))
  }, [])

  const idsSelecionados = useMemo(() => new Set(unidadesSelecionadas.map((ua) => ua.unidade_administrativa_id)), [unidadesSelecionadas])

  const uosDisponiveis = useMemo(
    () =>
      gruposEscopo
      .filter((g) => g?.uo?.id)
      .map((g) => ({
        id: g.uo.id,
        label: g.uo.label,
      })),
    [gruposEscopo]
  )

  useEffect(() => {
    if (!uoSelecionadaId) {
      setUnidadesAdministrativas([])
      setUnidadesSelecionadas([])
      setFiltroUa("")
      syncFormUnidades([])
      return
    }
    const grupo = gruposEscopo.find((g) => g.uo.id === uoSelecionadaId)
    const uasDaUo = grupo?.uas ?? []
    setUnidadesAdministrativas(uasDaUo)
    setUnidadesSelecionadas((prev) => {
      const filtradas = prev.filter((ua) => ua.unidade_orcamentaria_id === uoSelecionadaId)
      syncFormUnidades(filtradas)
      return filtradas
    })
  }, [uoSelecionadaId, gruposEscopo])

  const unidadesListadas = useMemo(() => {
    const base = somenteSelecionadas ? unidadesAdministrativas.filter((ua) => idsSelecionados.has(ua.unidade_administrativa_id)) : unidadesAdministrativas
    const termo = filtroUa.trim().toLowerCase()
    if (!termo) return base
    return base.filter((ua) => `${ua.codigo} ${ua.nome}`.toLowerCase().includes(termo))
  }, [filtroUa, idsSelecionados, somenteSelecionadas, unidadesAdministrativas])

  const syncFormUnidades = (selecionadas: EscopoUa[]) => {
    setValue("unidade", selecionadas.map((ua) => String(ua.unidade_administrativa_id)), { shouldValidate: true })
  }

  const toggleUa = (ua: EscopoUa) => {
    const jaSelecionada = idsSelecionados.has(ua.unidade_administrativa_id)
    const next = jaSelecionada
      ? unidadesSelecionadas.filter((item) => item.unidade_administrativa_id !== ua.unidade_administrativa_id)
      : [...unidadesSelecionadas, ua]
    setUnidadesSelecionadas(next)
    syncFormUnidades(next)
  }

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const selecionadasEfetivas = getSelecionadasEfetivas(
        unidadesSelecionadas,
        data.grupo,
        unidadesAdministrativas
      )

      await usuarioService.create({
        username: data.username,
        nome: data.nome,
        email: data.email,
        rf: data.rf,
        unidade_administrativa: selecionadasEfetivas[0]?.unidade_administrativa_id ?? null,
        unidade_orcamentaria: selecionadasEfetivas[0]?.unidade_orcamentaria_id ?? uoSelecionadaId ?? gestorUoId,
        unidades_administrativas: selecionadasEfetivas.map((ua) => ua.unidade_administrativa_id),
        group_name: data.grupo,
        password: data.password,
        password_confirm: data.confirmPassword,
        is_active: data.status === "ativo",
      })
      navigate("/usuarios")
    } catch (error: any) {
      const apiErrors = error?.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        const fieldMap: Record<string, keyof FormData> = {
          rf: "rf",
          email: "email",
          username: "username",
          nome: "nome",
          group_name: "grupo",
          password: "password",
          password_confirm: "confirmPassword",
          unidades_administrativas: "unidade",
          unidade_administrativa: "unidade",
        }
        let hasFieldError = false
        Object.entries(fieldMap).forEach(([apiField, formField]) => {
          const value = apiErrors[apiField]
          if (value) {
            hasFieldError = true
            const msg = Array.isArray(value) ? String(value[0]) : String(value)
            setError(formField, { type: "server", message: msg })
          }
        })
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
      <AppBreadcrumb items={[{ label: "Configurações", icon: Settings }, { label: "Usuários" }, { label: "Adicionar Usuário", isActive: true }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-700">Adicionar Usuário</h1>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => navigate(-1)} className={ACTION_BUTTON_CLASS}><ArrowLeft size={18} /></Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={loading} className="h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md">{loading ? "Salvando..." : "Salvar"}</Button>
          <Button onClick={() => navigate("/usuarios")} className={ACTION_BUTTON_CLASS}>Cancelar</Button>
        </div>
      </div>

      {errorMessage && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{errorMessage}</div>}

      <Card className="p-6 space-y-6">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Nome Completo{REQUIRED}</span><input type="text" placeholder="Digite o nome completo" className={INPUT_TEXT_CLASS} {...register("nome")} />{errors.nome && <span className="text-red-600 text-sm">{errors.nome.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">RF{REQUIRED}</span><input type="text" placeholder="Digite o rf" className={INPUT_TEXT_CLASS} {...register("rf")} />{errors.rf && <span className="text-red-600 text-sm">{errors.rf.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Grupo de Permissionamento{REQUIRED}</span><Select onValueChange={(value) => { setValue("grupo", value, { shouldValidate: true }); setUnidadesSelecionadas([]); syncFormUnidades([]) }}><SelectTrigger className={INPUT_CLASS}><SelectValue placeholder="Selecione os grupos" /></SelectTrigger><SelectContent><SelectItem value="GESTOR_PATRIMONIO">Gestor</SelectItem><SelectItem value="OPERADOR_INVENTARIO">Operador</SelectItem></SelectContent></Select>{errors.grupo && <span className="text-red-600 text-sm">{errors.grupo.message}</span>}</div>


          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Nome de Usuário de Acesso</span><input type="text" placeholder="Digite o nome de usuário de acesso" className={INPUT_TEXT_CLASS} {...register("username")} />{errors.username && <span className="text-red-600 text-sm">{errors.username.message}</span>}</div>
            <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">E-mail do Usuário{REQUIRED}</span><input type="email" placeholder="Digite o e-mail" className={INPUT_TEXT_CLASS} {...register("email")} />{errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}</div>
            <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Unidade Orçamentária{REQUIRED}</span><Select value={uoSelecionadaId ? String(uoSelecionadaId) : undefined} onValueChange={(value) => setUoSelecionadaId(Number(value))}><SelectTrigger className={INPUT_CLASS}><SelectValue placeholder="Selecione a UO" /></SelectTrigger><SelectContent>{uosDisponiveis.map((uo) => <SelectItem key={uo.id} value={String(uo.id)}>{uo.label}</SelectItem>)}</SelectContent></Select></div>
          </div>

                    <UnidadesAdministrativasSelector
            unidadesListadas={unidadesListadas}
            unidadesSelecionadasCount={unidadesSelecionadas.length}
            isSelecionada={(uaId) => idsSelecionados.has(uaId)}
            somenteSelecionadas={somenteSelecionadas}
            filtroUa={filtroUa}
            inputClassName={INPUT_TEXT_CLASS}
            requiredNode={unidadeObrigatoria ? REQUIRED : null}
            errorMessage={errors.unidade?.message}
            onFiltroChange={setFiltroUa}
            onToggleSomenteSelecionadas={() => setSomenteSelecionadas((prev) => !prev)}
            onToggleUa={toggleUa}
          />

          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Cadastre uma Senha</span><div className="relative"><input type={showPassword ? "text" : "password"} placeholder="Cadastre uma senha" className={INPUT_TEXT_CLASS} {...register("password")} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <span className="text-red-600 text-sm">{errors.password.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Confirme a Senha</span><div className="relative"><input type={showConfirmPassword ? "text" : "password"} placeholder="Confirme a senha" className={INPUT_TEXT_CLASS} {...register("confirmPassword")} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-500">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.confirmPassword && <span className="text-red-600 text-sm">{errors.confirmPassword.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Status</span><Select defaultValue="ativo" onValueChange={(value) => setValue("status", value)}><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select></div>
        </form>
      </Card>
    </div>
  )
}





