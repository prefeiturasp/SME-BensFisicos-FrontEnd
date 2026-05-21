import { Eye, EyeOff } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const INPUT_CLASS =
  "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center"
export const INPUT_TEXT_CLASS =
  "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"
export const ACTION_BUTTON_CLASS =
  "h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors"
export const REQUIRED = <span className="text-red-500 ml-1">*</span>
export const API_FIELD_PASSWORD = "password"
export const API_FIELD_PASSWORD_CONFIRM = "password_confirm"
export const API_FIELD_UNIDADES_ADMINISTRATIVAS = "unidades_administrativas"
export const API_FIELD_UNIDADE_ADMINISTRATIVA = "unidade_administrativa"

export function applyApiFieldErrors<T extends Record<string, unknown>>(
  apiErrors: Record<string, unknown>,
  fieldMap: Partial<Record<string, keyof T>>,
  setError: (name: keyof T, error: { type: string; message: string }) => void
) {
  let hasFieldError = false
  Object.entries(fieldMap).forEach(([apiField, formField]) => {
    if (!formField) return
    const value = apiErrors[apiField]
    if (!value) return
    hasFieldError = true
    const msg = Array.isArray(value) ? String(value[0]) : String(value)
    setError(formField, { type: "server", message: msg })
  })
  return hasFieldError
}

type PasswordStatusSectionProps = {
  senhaId: string
  confirmarSenhaId: string
  senhaField: any
  confirmarSenhaField: any
  showSenha: boolean
  showConfirmarSenha: boolean
  onToggleSenha: () => void
  onToggleConfirmarSenha: () => void
  senhaError?: string
  confirmarSenhaError?: string
  statusValue: string
  onStatusChange: (value: string) => void
}

export function PasswordStatusSection({
  senhaId,
  confirmarSenhaId,
  senhaField,
  confirmarSenhaField,
  showSenha,
  showConfirmarSenha,
  onToggleSenha,
  onToggleConfirmarSenha,
  senhaError,
  confirmarSenhaError,
  statusValue,
  onStatusChange,
}: Readonly<PasswordStatusSectionProps>) {
  return (
    <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={senhaId} className="text-sm font-semibold text-gray-700">Cadastre uma Senha</label>
        <div className="relative">
          <input id={senhaId} type={showSenha ? "text" : "password"} placeholder="Cadastre uma senha" className={`${INPUT_TEXT_CLASS} pr-10`} {...senhaField} />
          <button type="button" onClick={onToggleSenha} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {senhaError && <span className="text-red-600 text-sm">{senhaError}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={confirmarSenhaId} className="text-sm font-semibold text-gray-700">Confirme a Senha</label>
        <div className="relative">
          <input id={confirmarSenhaId} type={showConfirmarSenha ? "text" : "password"} placeholder="Confirme a senha" className={`${INPUT_TEXT_CLASS} pr-10`} {...confirmarSenhaField} />
          <button type="button" onClick={onToggleConfirmarSenha} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmarSenhaError && <span className="text-red-600 text-sm">{confirmarSenhaError}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="text-sm font-semibold text-gray-700">Status{REQUIRED}</label>
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger id="status" className={INPUT_CLASS}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
