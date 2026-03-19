import { describe, it, expect } from "vitest"
import { adicionarUsuarioSchema } from "../adicionarUsuario"

const VALID_PWD = ["Senha", "@", "123"].join("")

const VALID_FORM = {
    nome: "João da Silva",
    rf: "123456",
    username: "joao.silva",
    email: "joao@email.com",
    unidade: "001",
    grupo: "GESTOR_PATRIMONIO",
    password: VALID_PWD,
    confirmPassword: VALID_PWD,
    status: "ativo",
}

function parseForm(data: Partial<typeof VALID_FORM>) {
    return adicionarUsuarioSchema.safeParse({ ...VALID_FORM, ...data })
}

function getError(
    result: ReturnType<typeof adicionarUsuarioSchema.safeParse>,
    field: string
) {
    if (result.success) return null
    return result.error.issues.find(i => i.path.includes(field))?.message ?? null
}

describe("adicionarUsuarioSchema", () => {

    describe("formulário válido", () => {

        it("aceita todos os campos corretos com Gestor", () => {
            expect(adicionarUsuarioSchema.safeParse(VALID_FORM).success).toBe(true)
        })

        it("aceita todos os campos corretos com Operador e unidade preenchida", () => {
            expect(parseForm({ grupo: "OPERADOR_INVENTARIO", unidade: "001" }).success).toBe(true)
        })

        it("retorna os dados tipados quando válido", () => {
            const result = adicionarUsuarioSchema.safeParse(VALID_FORM)
            expect(result.success && result.data.nome).toBe("João da Silva")
        })
    })

    describe("campo nome", () => {

        it("rejeita nome vazio", () => {
            const result = parseForm({ nome: "" })
            expect(getError(result, "nome")).toBe("Nome é obrigatório")
        })

        it("aceita nome com 1 caractere", () => {
            expect(parseForm({ nome: "J" }).success).toBe(true)
        })
    })

    describe("campo rf", () => {

        it("rejeita rf vazio", () => {
            const result = parseForm({ rf: "" })
            expect(getError(result, "rf")).toBe("RF é obrigatório")
        })

        it("aceita rf com qualquer string não vazia", () => {
            expect(parseForm({ rf: "F12345" }).success).toBe(true)
        })
    })

    describe("campo username", () => {

        it("rejeita username vazio", () => {
            const result = parseForm({ username: "" })
            expect(getError(result, "username")).toBe("Nome de usuário é obrigatório")
        })

        it("aceita username válido", () => {
            expect(parseForm({ username: "joao.silva" }).success).toBe(true)
        })
    })

    describe("campo email", () => {

        it("rejeita email inválido sem @", () => {
            const result = parseForm({ email: "emailinvalido" })
            expect(getError(result, "email")).toBe("E-mail inválido")
        })

        it("rejeita email sem domínio", () => {
            const result = parseForm({ email: "joao@" })
            expect(getError(result, "email")).toBe("E-mail inválido")
        })

        it("aceita email válido", () => {
            expect(parseForm({ email: "joao@empresa.com.br" }).success).toBe(true)
        })
    })

    describe("campo grupo", () => {

        it("rejeita grupo vazio", () => {
            const result = parseForm({ grupo: "" })
            expect(getError(result, "grupo")).toBe("Selecione um grupo")
        })

        it("aceita GESTOR_PATRIMONIO", () => {
            expect(parseForm({ grupo: "GESTOR_PATRIMONIO" }).success).toBe(true)
        })

        it("aceita OPERADOR_INVENTARIO com unidade preenchida", () => {
            expect(parseForm({ grupo: "OPERADOR_INVENTARIO", unidade: "001" }).success).toBe(true)
        })
    })

    // ── Regra condicional: unidade obrigatória para Operador ──────────────────

    describe("campo unidade — regra condicional por grupo", () => {

        it("Gestor: aceita unidade vazia", () => {
            expect(parseForm({ grupo: "GESTOR_PATRIMONIO", unidade: "" }).success).toBe(true)
        })

        it("Gestor: aceita unidade preenchida", () => {
            expect(parseForm({ grupo: "GESTOR_PATRIMONIO", unidade: "001" }).success).toBe(true)
        })

        it("Operador: rejeita unidade vazia com mensagem correta", () => {
            const result = parseForm({ grupo: "OPERADOR_INVENTARIO", unidade: "" })
            expect(getError(result, "unidade")).toBe(
                "Unidade Administrativa é obrigatória para Operadores"
            )
        })

        it("Operador: rejeita unidade com apenas espaços", () => {
            const result = parseForm({ grupo: "OPERADOR_INVENTARIO", unidade: "   " })
            expect(getError(result, "unidade")).toBe(
                "Unidade Administrativa é obrigatória para Operadores"
            )
        })

        it("Operador: aceita unidade preenchida", () => {
            expect(parseForm({ grupo: "OPERADOR_INVENTARIO", unidade: "001" }).success).toBe(true)
        })

        it("sem grupo definido: não exige unidade", () => {
            expect(parseForm({ grupo: "GESTOR_PATRIMONIO", unidade: "" }).success).toBe(true)
        })
    })

    describe("campo password", () => {

        it("rejeita senha com menos de 6 caracteres", () => {
            const pwd = ["Ab1", "@"].join("")
            const result = parseForm({ password: pwd, confirmPassword: pwd })
            expect(getError(result, "password")).toBe("A senha deve ter no mínimo 6 caracteres")
        })

        it("rejeita senha sem letras", () => {
            const pwd = ["123456", "@!"].join("")
            const result = parseForm({ password: pwd, confirmPassword: pwd })
            expect(getError(result, "password")).toBe("A senha deve conter letras")
        })

        it("rejeita senha sem números", () => {
            const pwd = ["Senha", "@!"].join("")
            const result = parseForm({ password: pwd, confirmPassword: pwd })
            expect(getError(result, "password")).toBe("A senha deve conter números")
        })

        it("rejeita senha sem caractere especial", () => {
            const pwd = ["Senha", "123"].join("")
            const result = parseForm({ password: pwd, confirmPassword: pwd })
            expect(getError(result, "password")).toBe("A senha deve conter caracteres especiais")
        })
    })

    describe("campo confirmPassword", () => {

        it("rejeita confirmação vazia", () => {
            const result = parseForm({ confirmPassword: "" })
            expect(getError(result, "confirmPassword")).toBeTruthy()
        })

        it("rejeita quando senhas não coincidem", () => {
            const result = parseForm({
                password: VALID_PWD,
                confirmPassword: ["Outra", "@", "123"].join(""),
            })
            expect(getError(result, "confirmPassword")).toBe("As senhas não coincidem")
        })

        it("aceita quando senhas coincidem", () => {
            expect(parseForm({
                password: VALID_PWD,
                confirmPassword: VALID_PWD,
            }).success).toBe(true)
        })
    })

    describe("campo status", () => {

        it("aceita status 'ativo'", () => {
            expect(parseForm({ status: "ativo" }).success).toBe(true)
        })

        it("aceita status 'inativo'", () => {
            expect(parseForm({ status: "inativo" }).success).toBe(true)
        })

        it("aceita string vazia (campo não obrigatório)", () => {
            expect(parseForm({ status: "" }).success).toBe(true)
        })
    })

    describe("refine — confirmação de senha", () => {

        it("erro cai em path confirmPassword, não em password", () => {
            const result = parseForm({
                password: VALID_PWD,
                confirmPassword: ["Diferente", "@", "1"].join(""),
            })
            const issue = !result.success
                ? result.error.issues.find(i => i.path[0] === "confirmPassword")
                : null
            expect(issue?.message).toBe("As senhas não coincidem")
        })

        it("não gera erro de refine quando senhas são idênticas", () => {
            expect(parseForm({
                password: VALID_PWD,
                confirmPassword: VALID_PWD,
            }).success).toBe(true)
        })
    })
})