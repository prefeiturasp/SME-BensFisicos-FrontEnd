import { Eye, EyeOff } from "lucide-react"
import { useCallback, useEffect, useId, useMemo } from "react"
import type { Dispatch, InputHTMLAttributes, ReactNode, SetStateAction } from "react"
import type { UseFormSetValue } from "react-hook-form"
import type { EscopoGrupo, EscopoUa } from "../../../../auth/auth.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ValidatedField } from "@/components/form-fields/ValidatedField"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UnidadesAdministrativasSelector } from "../components/UnidadesAdministrativasSelector"

export const INPUT_CLASS =
  "!h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center"
export const INPUT_TEXT_CLASS =
  "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"
export const ACTION_BUTTON_CLASS =
  "h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors"
export const GESTOR_BADGE_TEXT = "Gestor acessa todas UAs da UO"
export const REQUIRED = <span className="text-red-500 ml-1">*</span>
export const API_FIELD_PASSWORD = "password"
export const API_FIELD_PASSWORD_CONFIRM = "password_confirm" // NOSONAR - Campo de API, não é senha
export const API_FIELD_UNIDADES_ADMINISTRATIVAS = "unidades_administrativas"
export const API_FIELD_UNIDADE_ADMINISTRATIVA = "unidade_administrativa"

export function FormSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-bold text-gray-700 border-b pb-2">{title}</h2>
      {children}
    </section>
  )
}

type UseUsuarioFormStateOptions<T extends Record<string, any> = Record<string, any>> = {
  gruposEscopo: EscopoGrupo[]
  uoSelecionadaId: number | null
  unidadesAdministrativas: EscopoUa[]
  unidadesSelecionadas: EscopoUa[]
  filtroUa: string
  todasUnidades: boolean
  setUnidadesAdministrativas: Dispatch<SetStateAction<EscopoUa[]>>
  setUnidadesSelecionadas: Dispatch<SetStateAction<EscopoUa[]>>
  setFiltroUa: Dispatch<SetStateAction<string>>
  setTodasUnidades: Dispatch<SetStateAction<boolean>>
  setValue: UseFormSetValue<T>
}

export function useUsuarioFormState<T extends Record<string, any> = Record<string, any>>({
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
}: UseUsuarioFormStateOptions<T>) {
  const idsSelecionados = useMemo(
    () => new Set(unidadesSelecionadas.map((ua) => ua.unidade_administrativa_id)),
    [unidadesSelecionadas]
  )

  const uosDisponiveis = useMemo(() => getUosDisponiveis(gruposEscopo), [gruposEscopo])

  const unidadesListadas = useMemo(
    () => filterUnidadesListadas(unidadesAdministrativas, filtroUa),
    [filtroUa, unidadesAdministrativas]
  )

  const syncFormUnidades = useCallback(
    (selecionadas: EscopoUa[]) => {
      setValue("unidade" as any, selecionadas.map((ua) => String(ua.unidade_administrativa_id)) as any, { shouldValidate: true })
    },
    [setValue]
  )

  const toggleUa = useCallback(
    (ua: EscopoUa) => {
      if (todasUnidades) {
        setTodasUnidades(false)
        const next = unidadesAdministrativas.filter(
          (item) => item.unidade_administrativa_id !== ua.unidade_administrativa_id
        )
        setUnidadesSelecionadas(next)
        syncFormUnidades(next)
        return
      }

      const jaSelecionada = idsSelecionados.has(ua.unidade_administrativa_id)
      const next = jaSelecionada
        ? unidadesSelecionadas.filter((item) => item.unidade_administrativa_id !== ua.unidade_administrativa_id)
        : [...unidadesSelecionadas, ua]
      const selecionouTodasManualmente = unidadesAdministrativas.length > 0 && next.length === unidadesAdministrativas.length
      setTodasUnidades(selecionouTodasManualmente)
      setUnidadesSelecionadas(next)
      syncFormUnidades(next)
    },
    [todasUnidades, unidadesAdministrativas, unidadesSelecionadas, idsSelecionados, setTodasUnidades, setUnidadesSelecionadas, syncFormUnidades]
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
  }, [gruposEscopo, syncFormUnidades, setFiltroUa, setUnidadesAdministrativas, setUnidadesSelecionadas, uoSelecionadaId])

  return {
    idsSelecionados,
    uosDisponiveis,
    unidadesListadas,
    syncFormUnidades,
    toggleUa,
  }
}

function hasValidUo(grupo: EscopoGrupo): grupo is EscopoGrupo & { uo: { id: number; label: string } } {
  return Boolean(grupo?.uo?.id)
}

export function getUosDisponiveis(gruposEscopo: EscopoGrupo[]): UoOption[] {
  return gruposEscopo.filter(hasValidUo).map((g) => ({ id: g.uo.id, label: g.uo.label }))
}

export function filterUnidadesListadas(unidadesAdministrativas: UaOption[], filtroUa: string) {
  const termo = filtroUa.trim().toLowerCase()
  if (!termo) return unidadesAdministrativas
  return unidadesAdministrativas.filter((ua) => `${ua.codigo} ${ua.nome}`.toLowerCase().includes(termo))
}

export function getApiErrorMessage(value: unknown): string {
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (typeof first === "string") return first
    if (typeof first === "number") return String(first)
  }
  if (typeof value === "string") return value
  return "Erro de validação."
}

export function buildFieldMap<T extends Record<string, unknown>>(
  passwordField: keyof T,
  passwordConfirmField: keyof T,
  unidadeField: keyof T
): Record<string, keyof T> {
  return {
    rf: "rf",
    email: "email",
    username: "username",
    nome: "nome",
    group_name: "grupo",
    [API_FIELD_PASSWORD]: passwordField,
    [API_FIELD_PASSWORD_CONFIRM]: passwordConfirmField,
    [API_FIELD_UNIDADES_ADMINISTRATIVAS]: unidadeField,
    [API_FIELD_UNIDADE_ADMINISTRATIVA]: unidadeField,
  }
}

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
    const msg = getApiErrorMessage(value)
    setError(formField, { type: "server", message: msg })
  })
  return hasFieldError
}

export function buildGrupoChangeHandler<T extends Record<string, any>>(
  setValue: UseFormSetValue<T>,
  setUnidadesSelecionadas: Dispatch<SetStateAction<EscopoUa[]>>,
  syncFormUnidades: (selecionadas: EscopoUa[]) => void,
  setTodasUnidades: Dispatch<SetStateAction<boolean>>
) {
  return (value: string) => {
    setValue("grupo" as any, value as any, { shouldValidate: true })
    if (value === "GESTOR_PATRIMONIO") {
      setUnidadesSelecionadas([])
      syncFormUnidades([])
    }
    setTodasUnidades(false)
  }
}

export type UaOption = EscopoUa

export type UoOption = {
  id: number
  label: string
}

type FormTextFieldProps = {
  id?: string
  label: string
  required?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
  value?: string | number
  className?: string
  rightNode?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value">

/**
 * Campo de texto no padrão de validação inline (rótulo vermelho + borda
 * vermelha + mensagem por campo), igual ao usado em UO/UA.
 */
export function FormTextField({
  id,
  label,
  required,
  placeholder,
  error,
  disabled,
  value,
  className,
  rightNode,
  ...inputProps
}: Readonly<FormTextFieldProps>) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <ValidatedField
      label={label}
      htmlFor={fieldId}
      error={error}
      required={required}
      className="flex flex-col gap-2"
    >
      <div className="relative">
        <Input
          id={fieldId}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={`${className ?? INPUT_TEXT_CLASS} ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          {...inputProps}
          value={value}
        />
        {rightNode}
      </div>
    </ValidatedField>
  )
}

type UserTopSectionProps = {
  nomeValue?: string
  rfValue?: string
  usernameValue?: string
  usernameDisabled?: boolean
  emailValue?: string
  grupoValue?: string
  statusValue: string
  uoSelecionadaId: number | null
  uosDisponiveis: UoOption[]
  unidadeObrigatoria?: boolean
  unidadesListadas: UaOption[]
  unidadesSelecionadas: UaOption[]
  idsSelecionados: Set<number>
  todasUnidades: boolean
  filtroUa: string
  unidadeError?: string
  uoError?: string
  disableUaSelector?: boolean
  onNomeChange?: InputHTMLAttributes<HTMLInputElement>["onChange"]
  onRfChange?: InputHTMLAttributes<HTMLInputElement>["onChange"]
  onUsernameChange?: InputHTMLAttributes<HTMLInputElement>["onChange"]
  onEmailChange?: InputHTMLAttributes<HTMLInputElement>["onChange"]
  onGrupoChange: (value: string) => void
  onStatusChange: (value: string) => void
  onUoChange: (value: number) => void
  onFiltroUaChange: (value: string) => void
  onToggleTodasUnidades: () => void
  onToggleUa: (ua: UaOption) => void
  nomeError?: string
  rfError?: string
  usernameError?: string
  emailError?: string
  grupoError?: string
}

export function UserTopSection({
  nomeValue,
  rfValue,
  usernameValue,
  usernameDisabled,
  emailValue,
  grupoValue,
  statusValue,
  uoSelecionadaId,
  uosDisponiveis,
  unidadeObrigatoria,
  unidadesListadas,
  unidadesSelecionadas,
  idsSelecionados,
  todasUnidades,
  filtroUa,
  unidadeError,
  uoError,
  disableUaSelector,
  onNomeChange,
  onRfChange,
  onUsernameChange,
  onEmailChange,
  onGrupoChange,
  onStatusChange,
  onUoChange,
  onFiltroUaChange,
  onToggleTodasUnidades,
  onToggleUa,
  nomeError,
  rfError,
  usernameError,
  emailError,
  grupoError,
}: Readonly<UserTopSectionProps>) {
  const isGestor = grupoValue === "GESTOR_PATRIMONIO"
  return (
    <form className="space-y-8">
      <FormSection title="Informações Gerais">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormTextField
        label="Nome Completo"
        required
        value={nomeValue}
        placeholder="Digite o nome completo"
        onChange={onNomeChange}
        error={nomeError}
      />
      <FormTextField
        label="RF"
        required
        value={rfValue}
        placeholder="Digite o RF"
        onChange={onRfChange}
        error={rfError}
      />
      <FormTextField
        label="Nome de Usuário de Acesso"
        value={usernameValue}
        placeholder={usernameDisabled ? "Não editável" : "Digite o nome de usuário de acesso"}
        onChange={onUsernameChange}
        disabled={usernameDisabled}
        className={usernameDisabled ? `${INPUT_TEXT_CLASS} bg-gray-100 cursor-not-allowed` : INPUT_TEXT_CLASS}
        error={usernameError}
      />

      <FormTextField
        label="E-mail do Usuário"
        required
        value={emailValue}
        placeholder="Digite o e-mail"
        onChange={onEmailChange}
        error={emailError}
      /> 

      <ValidatedField
        label={
          <span className="inline-flex w-fit items-center gap-2">
            <span>Grupo de Permissionamento</span>
            {isGestor ? (
              <span className="inline-flex items-center whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                {GESTOR_BADGE_TEXT}
              </span>
            ) : null}
          </span>
        }
        htmlFor="grupo"
        error={grupoError}
        required
        className="flex flex-col gap-2"
      >
        <Select value={grupoValue} onValueChange={onGrupoChange}>
          <SelectTrigger id="grupo" className={`${INPUT_CLASS} ${grupoError ? "border-red-500 focus:ring-red-500" : ""}`} aria-invalid={!!grupoError}>
            <SelectValue placeholder="Selecione os grupos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GESTOR_PATRIMONIO">Gestor</SelectItem>
            <SelectItem value="OPERADOR_INVENTARIO">Operador</SelectItem>
          </SelectContent>
        </Select>
      </ValidatedField>

      <ValidatedField label="Status" htmlFor="status" required className="flex flex-col gap-2">
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger id="status" className={INPUT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </ValidatedField>
        </div>
      </FormSection>

      <FormSection title="Vinculação">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ValidatedField
        label="Unidade Orçamentária"
        htmlFor="uo"
        error={uoError}
        required
        className="flex flex-col gap-2"
      >
        <Select value={uoSelecionadaId ? String(uoSelecionadaId) : undefined} onValueChange={(value) => onUoChange(Number(value))}>
          <SelectTrigger id="uo" className={`${INPUT_CLASS} ${uoError ? "border-red-500 focus:ring-red-500" : ""}`} aria-invalid={!!uoError}>
            <SelectValue placeholder="Selecione a UO" />
          </SelectTrigger>
          <SelectContent>
            {uosDisponiveis.map((uo) => (
              <SelectItem key={uo.id} value={String(uo.id)}>
                {uo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ValidatedField>

      <div>
        <UnidadesAdministrativasSelector
          label={isGestor ? "Notificações das UAs" : "Unidades Administrativas"}
          unidadesListadas={unidadesListadas}
          unidadesSelecionadas={unidadesSelecionadas}
          isSelecionada={(uaId) => idsSelecionados.has(uaId)}
          todasUnidades={todasUnidades}
          filtroUa={filtroUa}
          inputClassName={INPUT_TEXT_CLASS}
          requiredNode={unidadeObrigatoria ? REQUIRED : undefined}
          errorMessage={unidadeError}
          disabled={disableUaSelector}
          onFiltroChange={onFiltroUaChange}
          onToggleTodasUnidades={onToggleTodasUnidades}
          onToggleUa={onToggleUa}
        />
      </div>
        </div>
      </FormSection>
    </form>
  )
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
}: Readonly<PasswordStatusSectionProps>) {
  return (
    <div className="border-t pt-6">
      <FormSection title="Acesso">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ValidatedField
        label="Cadastre uma Senha"
        htmlFor={senhaId}
        error={senhaError}
        className="flex flex-col gap-2"
      >
        <div className="relative">
          <Input
            id={senhaId}
            type={showSenha ? "text" : "password"}
            placeholder="Cadastre uma senha"
            aria-invalid={!!senhaError}
            className={`${INPUT_TEXT_CLASS} pr-10 ${senhaError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            {...senhaField}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleSenha}
            aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
          >
            {showSenha ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
          </Button>
        </div>
      </ValidatedField>
      <ValidatedField
        label="Confirme a Senha"
        htmlFor={confirmarSenhaId}
        error={confirmarSenhaError}
        className="flex flex-col gap-2"
      >
        <div className="relative">
          <Input
            id={confirmarSenhaId}
            type={showConfirmarSenha ? "text" : "password"}
            placeholder="Confirme a senha"
            aria-invalid={!!confirmarSenhaError}
            className={`${INPUT_TEXT_CLASS} pr-10 ${confirmarSenhaError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            {...confirmarSenhaField}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleConfirmarSenha}
            aria-label={showConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
          >
            {showConfirmarSenha ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
          </Button>
        </div>
      </ValidatedField>
        </div>
      </FormSection>
    </div>
  )
}

export function buildToggleTodasHandler(
  grupoSelecionado: string,
  setTodasUnidades: (updater: (prev: boolean) => boolean) => void,
  setUnidadesSelecionadas: (value: UaOption[]) => void,
  syncFormUnidades: (selecionadas: UaOption[]) => void,
  setFiltroUa: (value: string) => void,
  unidadesDisponiveis: UaOption[]
) {
  return () => {
    setTodasUnidades((prev) => {
      const next = !prev
      if (next) {
        if (grupoSelecionado === "GESTOR_PATRIMONIO") {
          setUnidadesSelecionadas(unidadesDisponiveis)
          syncFormUnidades(unidadesDisponiveis)
        } else {
          setUnidadesSelecionadas([])
          syncFormUnidades([])
        }
        setFiltroUa("")
      } else {
        setUnidadesSelecionadas([])
        syncFormUnidades([])
        setFiltroUa("")
      }
      return next
    })
  }
}
