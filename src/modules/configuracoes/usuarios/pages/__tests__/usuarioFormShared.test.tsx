import { describe, expect, it, vi } from "vitest"

import {
  applyApiFieldErrors,
  buildFieldMap,
  buildToggleTodasHandler,
  filterUnidadesListadas,
  getApiErrorMessage,
  getUosDisponiveis,
} from "../usuarioFormShared"
import type { EscopoGrupo, EscopoUa } from "../../../../auth/auth.service"

describe("usuarioFormShared helpers", () => {
  it("returns the first API error message from arrays and strings", () => {
    expect(getApiErrorMessage(["erro 1", "erro 2"]).toString()).toBe("erro 1")
    expect(getApiErrorMessage([123]).toString()).toBe("123")
    expect(getApiErrorMessage("mensagem")).toBe("mensagem")
    expect(getApiErrorMessage({})).toBe("Erro de validação.")
  })

  it("builds a reusable API field map", () => {
    const fieldMap = buildFieldMap("password", "confirmPassword", "unidade")

    expect(fieldMap).toEqual(
      expect.objectContaining({
        rf: "rf",
        email: "email",
        username: "username",
        nome: "nome",
        group_name: "grupo",
        password: "password",
        password_confirm: "confirmPassword",
        unidades_administrativas: "unidade",
        unidade_administrativa: "unidade",
      })
    )
  })

  it("applies API field errors to the form and returns true when errors exist", () => {
    const apiErrors = {
      email: ["E-mail inválido"],
      group_name: ["Grupo inválido"],
    }
    const setError = vi.fn()
    const fieldMap = buildFieldMap("password", "confirmPassword", "unidade")

    const result = applyApiFieldErrors(apiErrors, fieldMap, setError)

    expect(result).toBe(true)
    expect(setError).toHaveBeenCalledTimes(2)
    expect(setError).toHaveBeenCalledWith("email", expect.objectContaining({ message: "E-mail inválido" }))
    expect(setError).toHaveBeenCalledWith("grupo", expect.objectContaining({ message: "Grupo inválido" }))
  })

  it("builds a toggle handler that clears selection and filter when toggled on", () => {
    let current = false
    const setTodasUnidades = vi.fn((updater: (prev: boolean) => boolean) => {
      current = updater(current)
    })
    const setUnidadesSelecionadas = vi.fn()
    const syncFormUnidades = vi.fn()
    const setFiltroUa = vi.fn()

    const handler = buildToggleTodasHandler(
      setTodasUnidades,
      setUnidadesSelecionadas,
      syncFormUnidades,
      setFiltroUa
    )

    handler()

    expect(setTodasUnidades).toHaveBeenCalled()
    expect(setUnidadesSelecionadas).toHaveBeenCalledWith([])
    expect(syncFormUnidades).toHaveBeenCalledWith([])
    expect(setFiltroUa).toHaveBeenCalledWith("")
    expect(current).toBe(true)
  })

  it("filters administrative units by code or name in a case-insensitive way", () => {
    const unidades: EscopoUa[] = [
      { unidade_administrativa_id: 1, unidade_orcamentaria_id: 10, codigo: "UA001", nome: "Unidade Central" },
      { unidade_administrativa_id: 2, unidade_orcamentaria_id: 10, codigo: "UA002", nome: "Unidade Norte" },
    ]

    expect(filterUnidadesListadas(unidades, "central")).toHaveLength(1)
    expect(filterUnidadesListadas(unidades, "ua002")).toHaveLength(1)
    expect(filterUnidadesListadas(unidades, "")).toHaveLength(2)
  })

  it("returns only selectable UOs from escopo groups", () => {
    const grupos = [
      { uo: { id: 1, label: "UO 1" }, uas: [] },
      { uo: undefined, uas: [] },
    ] as EscopoGrupo[]

    expect(getUosDisponiveis(grupos)).toEqual([{ id: 1, label: "UO 1" }])
  })
})
