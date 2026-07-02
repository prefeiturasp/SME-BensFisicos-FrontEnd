import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"

import ConfirmarAceiteModal from "../ConfirmarAceiteModal"

describe("ConfirmarAceiteModal", () => {
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

    it("chama onConfirm ao clicar em Confirmar", () => {
        const onConfirm = vi.fn()

        render(
            <ConfirmarAceiteModal
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        )

        fireEvent.click(screen.getByText("Confirmar"))

        expect(onConfirm).toHaveBeenCalledTimes(1)
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
    })
})
