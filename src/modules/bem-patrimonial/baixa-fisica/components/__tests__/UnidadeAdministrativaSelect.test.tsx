import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { UnidadeAdministrativaSelect } from "../UnidadeAdministrativaSelect"
import { unidadesAdministrativasService } from "../../../../configuracoes/unidades-administrativas/services/unidades-administrativas.service"

// ===================== MOCKS =====================

vi.mock("../../../../configuracoes/unidades-administrativas/services/unidades-administrativas.service", () => ({
    unidadesAdministrativasService: {
        list: vi.fn(),
    },
}))

vi.mock("@/components/ui/select", () => ({
    Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
        <div data-testid="select" data-value={value}>
            {children}
            <input
                data-testid="select-input"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                readOnly
            />
        </div>
    ),
    SelectTrigger: ({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) => (
        <div data-testid="select-trigger" id={id} className={className}>{children}</div>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
        <span data-testid="select-value" data-placeholder={placeholder} />
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="select-content">{children}</div>
    ),
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
        <div data-testid={`select-item-${value}`} data-value={value}>{children}</div>
    ),
}))

// ===================== FACTORIES =====================

function makeUnidades() {
    return [
        { id: 1, nome: "Unidade Alpha", sigla: "UA", codigo: "001" },
        { id: 2, nome: "Unidade Beta", sigla: "UB", codigo: "002" },
    ]
}

function makeListResponse(unidades = makeUnidades()) {
    return { results: unidades, count: unidades.length, next: null, previous: null } as never
}
// ===================== HELPERS =====================

function renderComponent(props: Partial<React.ComponentProps<typeof UnidadeAdministrativaSelect>> = {}) {
    const onChange = vi.fn()
    const result = render(
        <UnidadeAdministrativaSelect
            value=""
            onChange={onChange}
            {...props}
        />
    )
    return { ...result, onChange }
}

// ===================== TESTS =====================

describe("UnidadeAdministrativaSelect", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(unidadesAdministrativasService.list).mockResolvedValue(makeListResponse())
    })

    // --- Carregamento de unidades ---

    it("chama o serviço com pageSize 200 ao montar", async () => {
        renderComponent()
        await waitFor(() => {
            expect(unidadesAdministrativasService.list).toHaveBeenCalledWith({ pageSize: 200 })
        })
    })

    it("renderiza unidades após carregamento", async () => {
        renderComponent()
        await waitFor(() => {
            expect(screen.getByTestId("select-item-1")).toBeInTheDocument()
            expect(screen.getByTestId("select-item-2")).toBeInTheDocument()
        })
        expect(screen.getByText("001 - UA")).toBeInTheDocument()
        expect(screen.getByText("002 - UB")).toBeInTheDocument()
    })

    it("não quebra quando o serviço falha", async () => {
        vi.mocked(unidadesAdministrativasService.list).mockRejectedValue(new Error("Network error"))
        renderComponent()
        await waitFor(() => {
            expect(unidadesAdministrativasService.list).toHaveBeenCalled()
        })
        expect(screen.queryByTestId("select-item-1")).not.toBeInTheDocument()
    })

    // --- Valor do select ---

    it("usa '__none__' quando value vazio e includeAll é false", () => {
        renderComponent({ value: "", includeAll: false })
        expect(screen.getByTestId("select")).toHaveAttribute("data-value", "__none__")
    })

    it("usa '__all__' quando value vazio e includeAll é true", () => {
        renderComponent({ value: "", includeAll: true })
        expect(screen.getByTestId("select")).toHaveAttribute("data-value", "__all__")
    })

    it("usa o value fornecido quando não vazio", () => {
        renderComponent({ value: "5" })
        expect(screen.getByTestId("select")).toHaveAttribute("data-value", "5")
    })

    // --- Opções includeAll / placeholder ---

    it("exibe 'Todas as unidades' quando includeAll é true", async () => {
        renderComponent({ includeAll: true })
        expect(screen.getByTestId("select-item-__all__")).toBeInTheDocument()
        expect(screen.getByText("Todas as unidades")).toBeInTheDocument()
    })

    it("não exibe 'Todas as unidades' quando includeAll é false", () => {
        renderComponent({ includeAll: false })
        expect(screen.queryByTestId("select-item-__all__")).not.toBeInTheDocument()
    })

    it("exibe item placeholder quando includeAll é false", () => {
        renderComponent({ includeAll: false, placeholder: "Escolha uma unidade" })
        expect(screen.getByTestId("select-item-__none__")).toBeInTheDocument()
        expect(screen.getByText("Escolha uma unidade")).toBeInTheDocument()
    })

    it("não exibe item __none__ quando includeAll é true", () => {
        renderComponent({ includeAll: true })
        expect(screen.queryByTestId("select-item-__none__")).not.toBeInTheDocument()
    })

    // --- handleChange ---

    it("chama onChange com o valor quando não é '__all__'", async () => {
        const { fireEvent } = await import("@testing-library/react")
        const { onChange } = renderComponent()
        fireEvent.change(screen.getByTestId("select-input"), { target: { value: "3" } })
        expect(onChange).toHaveBeenCalledWith("3")
    })

    // --- Props ---

    it("passa id para o SelectTrigger", () => {
        renderComponent({ id: "meu-select" })
        expect(screen.getByTestId("select-trigger")).toHaveAttribute("id", "meu-select")
    })

    it("passa className para o SelectTrigger", () => {
        renderComponent({ className: "custom-class" })
        expect(screen.getByTestId("select-trigger")).toHaveClass("custom-class")
    })

    it("passa placeholder para SelectValue", () => {
        renderComponent({ placeholder: "Selecione aqui" })
        expect(screen.getByTestId("select-value")).toHaveAttribute("data-placeholder", "Selecione aqui")
    })

    it("usa placeholder padrão quando não fornecido", () => {
        renderComponent()
        expect(screen.getByTestId("select-value")).toHaveAttribute("data-placeholder", "Selecione uma unidade")
    })
})