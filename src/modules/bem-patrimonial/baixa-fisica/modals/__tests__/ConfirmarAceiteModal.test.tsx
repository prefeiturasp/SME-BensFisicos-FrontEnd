import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

import ConfirmarAceiteModal from "../ConfirmarAceiteModal"

const toastError = vi.fn()
const toastSuccess = vi.fn()
vi.mock("sonner", () => ({
    toast: {
        error: (...args: unknown[]) => toastError(...args),
        success: (...args: unknown[]) => toastSuccess(...args),
    },
}))

describe("ConfirmarAceiteModal", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renderiza título e mensagem de confirmação", () => {
        render(
            <ConfirmarAceiteModal
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(
            screen.getByText("Confirmar geração de laudo de Baixa Física")
        ).toBeInTheDocument()
        expect(
            screen.getByText(/não será mais possível incluir ou excluir itens/i)
        ).toBeInTheDocument()
    })

    it("renderiza input de Número do Processo com máscara", () => {
        render(
            <ConfirmarAceiteModal
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )
        expect(screen.getByLabelText("Número do Processo")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("6016.2025/0117371-7")).toBeInTheDocument()
        expect(screen.getByText("Formato: XXXX.XXXX/XXXXXXX-X")).toBeInTheDocument()
    })

    it("chama onCancel ao clicar em Cancelar", () => {
        const onCancel = vi.fn()

        render(
            <ConfirmarAceiteModal
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        )

        fireEvent.click(screen.getByText("Cancelar"))

        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it("chama onCancel ao clicar em Fechar", () => {
        const onCancel = vi.fn()

        render(
            <ConfirmarAceiteModal
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        )

        fireEvent.click(screen.getByLabelText("Fechar"))

        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it("desabilita Confirmar quando processo está vazio ou inválido", () => {
        render(
            <ConfirmarAceiteModal
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )
        const btn = screen.getByText("Confirmar")
        expect(btn).toBeDisabled()

        const input = screen.getByLabelText("Número do Processo")
        fireEvent.change(input, { target: { value: "123" } })
        expect(screen.getByText("Confirmar")).toBeDisabled()

        fireEvent.change(input, { target: { value: "6016.2025/0117371-7" } })
        expect(screen.getByText("Confirmar")).not.toBeDisabled()
    })

    it("aplica máscara ao digitar o processo", () => {
        render(
            <ConfirmarAceiteModal
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )
        const input = screen.getByLabelText("Número do Processo") as HTMLInputElement
        fireEvent.change(input, { target: { value: "6016202501173717" } })
        expect(input.value).toBe("6016.2025/0117371-7")
    })

    it("não chama onConfirm quando tenta confirmar sem processo (botão desabilitado)", () => {
        const onConfirm = vi.fn()
        render(
            <ConfirmarAceiteModal
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )
        const btn = screen.getByText("Confirmar")
        expect(btn).toBeDisabled()
        fireEvent.click(btn)
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it("não chama onConfirm quando processo fora do padrão XXXX.XXXX/XXXXXXX-X (botão permanece desabilitado)", () => {
        const onConfirm = vi.fn()
        render(
            <ConfirmarAceiteModal
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )
        const input = screen.getByLabelText("Número do Processo")
        fireEvent.change(input, { target: { value: "1234.5678/123" } })
        const btn = screen.getByText("Confirmar")
        expect(btn).toBeDisabled()
        fireEvent.click(btn)
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it("chama onConfirm com processo válido mascarado", () => {
        const onConfirm = vi.fn()

        render(
            <ConfirmarAceiteModal
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )

        const input = screen.getByLabelText("Número do Processo")
        fireEvent.change(input, { target: { value: "6016202501173717" } })
        expect((input as HTMLInputElement).value).toBe("6016.2025/0117371-7")

        fireEvent.click(screen.getByText("Confirmar"))

        expect(onConfirm).toHaveBeenCalledTimes(1)
        expect(onConfirm).toHaveBeenCalledWith("6016.2025/0117371-7")
        expect(toastError).not.toHaveBeenCalled()
    })

    it("mostra toast.error ao pressionar Enter sem processo", () => {
        const onConfirm = vi.fn()
        render(
            <ConfirmarAceiteModal
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )
        const input = screen.getByLabelText("Número do Processo")
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" })
        expect(toastError).toHaveBeenCalledWith(expect.stringContaining("obrigatório"))
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it("mostra toast.error ao pressionar Enter com processo fora do padrão", () => {
        const onConfirm = vi.fn()
        render(
            <ConfirmarAceiteModal
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )
        const input = screen.getByLabelText("Número do Processo")
        fireEvent.change(input, { target: { value: "1234.5678/123" } })
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" })
        expect(toastError).toHaveBeenCalledWith(expect.stringContaining("XXXX.XXXX/XXXXXXX-X"))
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it("desabilita ações e exibe estado de loading", () => {
        render(
            <ConfirmarAceiteModal
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
                loading
            />
        )

        expect(screen.getByText("Cancelar")).toBeDisabled()
        expect(screen.getByLabelText("Fechar")).toBeDisabled()
        expect(screen.getByText("Confirmando...")).toBeDisabled()
        expect(screen.getByLabelText("Número do Processo")).toBeDisabled()
    })
})
