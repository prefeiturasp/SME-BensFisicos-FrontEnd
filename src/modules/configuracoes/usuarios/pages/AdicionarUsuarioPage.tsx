import { ArrowLeft, Settings, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

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

export default function AdicionarUsuarioPage() {

  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(adicionarUsuarioSchema),
    defaultValues: {
      status: "ativo",
    },
  })

  const onSubmit = (data: FormData) => {
    console.log("dados validados", data)
  }

  const REQUIRED = (
    <span className="text-red-500 ml-1">*</span>
  )

  return (
    <div className="p-8 space-y-4">

      {/* Breadcrumb */}
      <AppBreadcrumb
        items={[
          { label: "Configurações", icon: Settings },
          { label: "Usuários" },
          { label: "Adicionar Usuário", isActive: true },
        ]}
      />

      {/* Header */}
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
            className="h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md"
          >
            Salvar
          </Button>

          <Button
            onClick={() => navigate("/usuarios")}
            className={ACTION_BUTTON_CLASS}
          >
            Cancelar
          </Button>

        </div>
      </div>

      {/* Card */}
      <Card className="p-6 space-y-6 h-[calc(70vh-75px)]">

        <form className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Nome */}
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

          {/* RF */}
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

          {/* Unidade Administrativa */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Unidade Administrativa{REQUIRED}
            </label>

            <Select onValueChange={(value) => setValue("unidade", value)}>

              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue placeholder="Selecione uma UA" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1">
                  01 - Secretaria de Educação
                </SelectItem>
              </SelectContent>

            </Select>

            {errors.unidade && (
              <span className="text-red-600 text-sm">
                {errors.unidade.message}
              </span>
            )}
          </div>

          {/* Username */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Nome de Usuário de Acesso
            </label>

            <input
              type="text"
              placeholder="Digite o nome de usuário de acesso"
              className={INPUT_TEXT_CLASS}
              {...register("username")}
            />

            {errors.username && (
              <span className="text-red-600 text-sm">
                {errors.username.message}
              </span>
            )}
          </div>

          {/* Email */}
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

          {/* Grupo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Grupo de Permissionamento{REQUIRED}
            </label>

            <Select onValueChange={(value) => setValue("grupo", value)}>

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

          {/* Senha */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Cadastre uma Senha
            </label>

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

            {errors.password && (
              <span className="text-red-600 text-sm">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Confirmar senha */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Confirme a Senha
            </label>

            <div className="relative">

              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme a senha"
                className={INPUT_TEXT_CLASS}
                {...register("confirmPassword")}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-3 text-gray-500"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

            {errors.confirmPassword && (
              <span className="text-red-600 text-sm">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Status
            </label>

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

          </div>

        </form>

      </Card>
    </div>
  )
}