import { describe, it, expect } from "vitest"
import { newPasswordSchema, PASSWORD_REQUIREMENTS } from "../password"

const VALID_PWD = ["Senha", "@", "123"].join("")

function parsePassword(value: string) {
    return newPasswordSchema.safeParse(value)
}

describe("newPasswordSchema", () => {

    describe("senhas válidas", () => {

        it("aceita senha com letras, números e caractere especial", () => {
            expect(parsePassword(VALID_PWD).success).toBe(true)
        })

        it("aceita senha com 6 caracteres exatos", () => {
            expect(parsePassword("Ab1@cd").success).toBe(true)
        })

        it("aceita senha com múltiplos caracteres especiais", () => {
            expect(parsePassword("Abc123!@#").success).toBe(true)
        })
    })

    describe("comprimento mínimo", () => {

        it("rejeita senha com menos de 6 caracteres", () => {
            const result = parsePassword("Ab1@c")
            expect(result.success).toBe(false)
            expect(!result.success && result.error.issues[0].message).toBe(
                "A senha deve ter no mínimo 6 caracteres"
            )
        })

        it("rejeita string vazia", () => {
            expect(parsePassword("").success).toBe(false)
        })
    })

    describe("regra de letras", () => {

        it("rejeita senha sem nenhuma letra", () => {
            const result = parsePassword("123456@!")
            expect(result.success).toBe(false)
            const messages = !result.success
                ? result.error.issues.map(i => i.message)
                : []
            expect(messages).toContain("A senha deve conter letras")
        })

        it("aceita senha com letra minúscula", () => {
            expect(parsePassword("abc123@!").success).toBe(true)
        })

        it("aceita senha com letra maiúscula", () => {
            expect(parsePassword("ABC123@!").success).toBe(true)
        })
    })

    describe("regra de números", () => {

        it("rejeita senha sem nenhum número", () => {
            const result = parsePassword("Senha@!")
            expect(result.success).toBe(false)
            const messages = !result.success
                ? result.error.issues.map(i => i.message)
                : []
            expect(messages).toContain("A senha deve conter números")
        })
    })

    describe("regra de caracteres especiais", () => {

        it("rejeita senha sem caractere especial", () => {
            const result = parsePassword("Senha123")
            expect(result.success).toBe(false)
            const messages = !result.success
                ? result.error.issues.map(i => i.message)
                : []
            expect(messages).toContain("A senha deve conter caracteres especiais")
        })

        it("aceita senha com ponto como caractere especial", () => {
            expect(parsePassword("Senha1.2").success).toBe(true)
        })

        it("aceita senha com hífen como caractere especial", () => {
            expect(parsePassword("Senha1-2").success).toBe(true)
        })

        it("aceita senha com underline como caractere especial", () => {
            expect(parsePassword("Senha1_2").success).toBe(true)
        })
    })

    describe("múltiplas violações", () => {

        it("acumula erros de letras e números ao mesmo tempo", () => {
            const result = parsePassword("@@@@@@")
            expect(result.success).toBe(false)
            const messages = !result.success
                ? result.error.issues.map(i => i.message)
                : []
            expect(messages).toContain("A senha deve conter letras")
            expect(messages).toContain("A senha deve conter números")
        })
    })
})

describe("PASSWORD_REQUIREMENTS", () => {

    it("exporta exatamente 3 requisitos", () => {
        expect(PASSWORD_REQUIREMENTS).toHaveLength(3)
    })

    it("inclui requisito sobre informações pessoais", () => {
        expect(PASSWORD_REQUIREMENTS[0]).toContain("informações pessoais")
    })

    it("inclui requisito de mínimo de 6 caracteres", () => {
        expect(PASSWORD_REQUIREMENTS[1]).toContain("6 caracteres")
    })

    it("inclui requisito de letras, números e caracteres especiais", () => {
        expect(PASSWORD_REQUIREMENTS[2]).toContain("letras, números e caracteres especiais")
    })
})