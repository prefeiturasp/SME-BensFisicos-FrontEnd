import { ArrowLeft, Settings } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { usuarioService, type Usuario } from "../service/usuario.service"

const INPUT_TEXT_CLASS =
  "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-gray-50 cursor-not-allowed"

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

type CampoProps = {
  readonly label: string
  readonly value: string | null | undefined
  readonly required?: boolean
}

function Campo({ label, value, required }: CampoProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        readOnly
        value={value ?? "—"}
        className={INPUT_TEXT_CLASS}
      />
    </div>
  )
}

export default function ViewUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const carregarUsuario = async () => {
      if (!id) return

      try {
        setLoading(true)
        const data = await usuarioService.retrieve(Number(id))
        setUsuario(data)
      } catch {
        setErrorMessage("Erro ao carregar os dados do usuário.")
      } finally {
        setLoading(false)
      }
    }

    carregarUsuario()
  }, [id])

  const handleEditar = () => {
    navigate(`/usuarios/${id}/editar`)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-4">

      <AppBreadcrumb
        items={[
          { label: "Configurações", icon: Settings },
          { label: "Usuários" },
          { label: "Detalhar Usuário", isActive: true },
        ]}
      />

      <div className="flex items-center justify-between">

        <h1 className="text-xl font-bold tracking-tight text-gray-700">
          Detalhar Usuário
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
            onClick={handleEditar}
            className={ACTION_BUTTON_CLASS}
          >
            Editar
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">
          {errorMessage}
        </div>
      )}

      {usuario && (
        <Card className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 1 */}
            <Campo
              label="Nome Completo"
              value={usuario.nome}
              required
            />

            {/* 2 */}
            <Campo
              label="RF"
              value={usuario.rf}
              required
            />

            {/* 3 */}
            <Campo
              label="Grupo de Permissionamento"
              value={usuario.grupo_nome}
              required
            />

            {/* 4 */}
            <Campo
              label="Unidade Administrativa"
              value={
                usuario.unidade_codigo && usuario.unidade_nome
                  ? `${usuario.unidade_codigo} - ${usuario.unidade_nome}`
                  : null
              }
            />

            {/* 5 */}
            <Campo
              label="Nome de Usuário de Acesso"
              value={usuario.username}
            />

            {/* 6 */}
            <Campo
              label="E-mail do Usuário"
              value={usuario.email}
              required
            />

            {/* 7 */}
            <Campo
              label="Status"
              value={usuario.status_display}
            />

          </div>

        </Card>
      )}

    </div>
  )
}