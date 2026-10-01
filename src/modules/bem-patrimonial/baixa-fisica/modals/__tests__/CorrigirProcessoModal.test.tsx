import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

import CorrigirProcessoModal, {
    CORRIGIR_PROCESSO_FORMATO_MSG,
    CORRIGIR_PROCESSO_OBRIGATORIO_MSG,
} from "../CorrigirProcessoModal"

const toastError = vi.fn()
vi.mock("sonner", () => ({
    toast: {
        error: (...args: unknown[]) => toastError(...args),
        success: vi.fn(),
    },
}))

describe("CorrigirProcessoModal", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("exibe o valor atual e pré-preenche o input", () => {
        render(
            <CorrigirProcessoModal
                valorAtual="6016.2025/0117371-7"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(screen.getByText("Corrigir número do processo")).toBeInTheDocument()
        expect(screen.getByText("6016.2025/0117371-7")).toBeInTheDocument()
        expect(screen.getByLabelText("Novo número do processo")).toHaveValue("6016.2025/0117371-7")
    })

    it("exibe '-' quando não há valor atual", () => {
        render(
            <CorrigirProcessoModal
                valorAtual={null}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(screen.getByText("-")).toBeInTheDocument()
        expect(screen.getByLabelText("Novo número do processo")).toHaveValue("")
    })

    it("desabilita Salvar quando vazio ou inválido e habilita quando válido", () => {
        render(
            <CorrigirProcessoModal
                valorAtual={null}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        expect(screen.getByText("Salvar")).toBeDisabled()

        fireEvent.change(screen.getByLabelText("Novo número do processo"), {
            target: { value: "123" },
        })
        expect(screen.getByText("Salvar")).toBeDisabled()

        fireEvent.change(screen.getByLabelText("Novo número do processo"), {
            target: { value: "6016.2025/0117371-7" },
        })
        expect(screen.getByText("Salvar")).not.toBeDisabled()
    })

    it("aplica máscara ao digitar", () => {
        render(
            <CorrigirProcessoModal
                valorAtual={null}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        const input = screen.getByLabelText("Novo número do processo") as HTMLInputElement
        fireEvent.change(input, { target: { value: "6016202501173717" } })
        expect(input.value).toBe("6016.2025/0117371-7")
    })

    it("mostra toast ao confirmar via Enter sem valor", () => {
        render(
            <CorrigirProcessoModal
                valorAtual={null}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        )

        fireEvent.keyDown(screen.getByLabelText("Novo número do processo"), {
            key: "Enter",
            code: "Enter",
        })

        expect(toastError).toHaveBeenCalledWith(CORRIGIR_PROCESSO_OBRIGATORIO_MSG)
    })

    it("mostra toast ao confirmar via Enter com formato inválido", () => {
        const onConfirm = vi.fn()
        render(
            <CorrigirProcessoModal
                valorAtual="6016.2025/0117371-7"
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )

        const input = screen.getByLabelText("Novo número do processo")
        fireEvent.change(input, { target: { value: "1234.5678/123" } })
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

        expect(toastError).toHaveBeenCalledWith(CORRIGIR_PROCESSO_FORMATO_MSG)
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it("chama onConfirm com o número válido", () => {
        const onConfirm = vi.fn()
        render(
            <CorrigirProcessoModal
                valorAtual="6016.2025/0000000-0"
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )

        fireEvent.change(screen.getByLabelText("Novo número do processo"), {
            target: { value: "6016202501173717" },
        })
        fireEvent.click(screen.getByText("Salvar"))

        expect(onConfirm).toHaveBeenCalledTimes(1)
        expect(onConfirm).toHaveBeenCalledWith("6016.2025/0117371-7")
    })

    it("mantém Salvar desabilitado quando o número é igual ao atual", () => {
        const onConfirm = vi.fn()
        render(
            <CorrigirProcessoModal
                valorAtual="6016.2025/0117371-7"
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )

        expect(screen.getByText("Salvar")).toBeDisabled()
        fireEvent.click(screen.getByText("Salvar"))
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it("chama onCancel e respeita loading", () => {
        const onCancel = vi.fn()
        render(
            <CorrigirProcessoModal
                valorAtual="6016.2025/0117371-7"
                onConfirm={vi.fn()}
                onCancel={onCancel}
                loading
            />
        )

        expect(screen.getByText("Salvando...")).toBeDisabled()
        expect(screen.getByText("Cancelar")).toBeDisabled()
        expect(screen.getByLabelText("Novo número do processo")).toBeDisabled()
    })
})
