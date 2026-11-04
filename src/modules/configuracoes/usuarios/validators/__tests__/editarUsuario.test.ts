import { describe, it, expect } from "vitest"
import { editarUsuarioSchema } from "../editarUsuario"

const baseData = {
  nome: "Samuel",
  rf: "123456",
  email: "samuel@email.com",
  grupo: "GESTOR_PATRIMONIO",
  status: "ativo",
}

describe("editarUsuarioSchema", () => {

  // ---------------------------------------------------------
  // ✅ CAMPOS OBRIGATÓRIOS
  // ---------------------------------------------------------
  it("deve validar dados válidos", () => {
    const result = editarUsuarioSchema.safeParse(baseData)
    expect(result.success).toBe(true)
  })

  it("deve falhar se nome estiver vazio", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      nome: "",
    })

    expect(result.success).toBe(false)
  })

  it("deve falhar se rf estiver vazio", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      rf: "",
    })

    expect(result.success).toBe(false)
  })

  it("deve falhar se email for inválido", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      email: "email-invalido",
    })

    expect(result.success).toBe(false)
  })

  // ---------------------------------------------------------
  // 🔐 SENHA
  // ---------------------------------------------------------
  it("deve aceitar senha válida", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      senha: "abc123!",
      confirmarSenha: "abc123!",
    })

    expect(result.success).toBe(true)
  })

  it("deve falhar se senha tiver menos de 6 caracteres", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      senha: "a1!",
      confirmarSenha: "a1!",
    })

    expect(result.success).toBe(false)
  })

  it("deve falhar se senha não tiver letra", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      senha: "123456!",
      confirmarSenha: "123456!",
    })

    expect(result.success).toBe(false)
  })

  it("deve falhar se senha não tiver número", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      senha: "abcdef!",
      confirmarSenha: "abcdef!",
    })

    expect(result.success).toBe(false)
  })

  it("deve falhar se senha não tiver caractere especial", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      senha: "abc123",
      confirmarSenha: "abc123",
    })

    expect(result.success).toBe(false)
  })

  it("deve permitir senha vazia (não alterar senha)", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      senha: "",
      confirmarSenha: "",
    })

    expect(result.success).toBe(true)
  })

  // ---------------------------------------------------------
  // 🔁 CONFIRMAÇÃO DE SENHA
  // ---------------------------------------------------------
  it("deve falhar se confirmação de senha for diferente", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      senha: "abc123!",
      confirmarSenha: "abc123!!",
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.issues.some(
          (e) => e.path.includes("confirmarSenha")
        )
      ).toBe(true)
    }
  })

  // ---------------------------------------------------------
  // 🧠 REGRA DE NEGÓCIO: OPERADOR PRECISA DE UA
  // ---------------------------------------------------------
  it("deve falhar se operador não tiver unidade", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      grupo: "OPERADOR_INVENTARIO",
      unidade: [],
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.issues.some(
          (e) => e.path.includes("unidade")
        )
      ).toBe(true)
    }
  })

  it("deve aceitar operador com unidade", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      grupo: "OPERADOR_INVENTARIO",
      unidade: ["1"],
    })

    expect(result.success).toBe(true)
  })

  it("gestor não precisa de unidade", () => {
    const result = editarUsuarioSchema.safeParse({
      ...baseData,
      grupo: "GESTOR_PATRIMONIO",
      unidade: [],
    })

    expect(result.success).toBe(true)
  })

})
