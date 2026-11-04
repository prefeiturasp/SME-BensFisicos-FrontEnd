import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { UnidadeAdministrativaSelect } from "../UnidadeAdministrativaSelect"
import { unidadesAdministrativasService } from "../../../../configuracoes/unidades-administrativas/services/unidades-administrativas.service"

// ===================== MOCKS =====================

vi.mock("../../../../configuracoes/unidades-administrativas/services/unidades-administrativas.service", () => ({
    unidadesAdministrativasService: {
        list: vi.fn(),
    },
}))

vi.mock("@/auth/useAuth", () => ({
    useAuth: vi.fn(),
}))

vi.mock("@/components/ui/select", () => ({
    Select: ({
        value,
        onValueChange,
        children,
    }: {
        value: string
        onValueChange: (v: string) => void
        children: React.ReactNode
    }) => (
        <div data-testid="select" data-value={value}>
            {children}
            {/*
             * O input abaixo aciona onValueChange diretamente via data-onchange.
             * Usamos um atributo de callback registrado no DOM para poder
             * chamar fireEvent de forma previsível nos testes de handleChange.
             */}
            <button
                data-testid="select-trigger-value"
                onClick={() => onValueChange("__all__")}
                hidden
            />
            <input
                data-testid="select-input"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                readOnly
            />
        </div>
    ),
    SelectTrigger: ({
        id,
        className,
        children,
    }: {
        id?: string
        className?: string
        children: React.ReactNode
    }) => (
        <div data-testid="select-trigger" id={id} className={className}>
            {children}
        </div>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
        <span data-testid="select-value" data-placeholder={placeholder} />
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="select-content">{children}</div>
    ),
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
        <div data-testid={`select-item-${value}`} data-value={value}>
            {children}
        </div>
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

function makeUserComEscopo() {
    return {
        id: 1,
        username: "operador",
        nome: "Operador Teste",
        email: "op@test.com",
        rf: "12345",
        is_gestor_patrimonio: false,
        is_operador_inventario: true,
        must_change_password: false,
        uo_ativa: null,
        ua_ativa: null,
        opcoes_escopo: {
            grupos: [
                {
                    uo: {
                        id: 10,
                        codigo: "UO-10",
                        nome: "Unidade Orçamentária 10",
                        label: "UO-10 - SME",
                        selecionavel: true,
                        unidade_administrativa_id: null,
                        unidade_orcamentaria_id: 10,
                    },
                    uas: [
                        {
                            id: 100,
                            codigo: "001",
                            nome: "Unidade Alpha",
                            label: "001 - UA",
                            unidade_administrativa_id: 1,
                            unidade_orcamentaria_id: 10,
                        },
                        {
                            id: 101,
                            codigo: "002",
                            nome: "Unidade Beta",
                            label: "002 - UB",
                            unidade_administrativa_id: 2,
                            unidade_orcamentaria_id: 10,
                        },
                    ],
                },
            ],
        },
    }
}

// ===================== HELPERS =====================

async function mockUseAuth(user: ReturnType<typeof makeUserComEscopo> | null = null) {
    const { useAuth } = await import("@/auth/useAuth")
    vi.mocked(useAuth).mockReturnValue({ user } as never)
}

function renderComponent(
    props: Partial<React.ComponentProps<typeof UnidadeAdministrativaSelect>> = {}
) {
    const onChange = vi.fn()
    const result = render(
        <UnidadeAdministrativaSelect value="" onChange={onChange} {...props} />
    )
    return { ...result, onChange }
}

// ===================== TESTS =====================

describe("UnidadeAdministrativaSelect", () => {

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(unidadesAdministrativasService.list).mockResolvedValue(makeListResponse())
    })

    // -------------------------------------------------------------------------
    // scopedToUser=false (default) — usa o serviço de listagem
    // -------------------------------------------------------------------------

    describe("scopedToUser=false (default)", () => {

        beforeEach(async () => {
            await mockUseAuth(null)
        })

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
    })

    // -------------------------------------------------------------------------
    // scopedToUser=true — lê do useAuth (/me), sem chamar o serviço
    // -------------------------------------------------------------------------

    describe("scopedToUser=true", () => {

        beforeEach(async () => {
            await mockUseAuth(makeUserComEscopo())
        })

        it("não chama o serviço de listagem", async () => {
            renderComponent({ scopedToUser: true })
            // Aguarda um tick para garantir que qualquer efeito assíncrono teria rodado
            await waitFor(() => {
                expect(unidadesAdministrativasService.list).not.toHaveBeenCalled()
            })
        })

        it("renderiza as UAs do escopo do usuário", () => {
            renderComponent({ scopedToUser: true })
            expect(screen.getByTestId("select-item-1")).toBeInTheDocument()
            expect(screen.getByTestId("select-item-2")).toBeInTheDocument()
            expect(screen.getByText("001 - 001 - UA")).toBeInTheDocument()
            expect(screen.getByText("002 - 002 - UB")).toBeInTheDocument()
        })

        it("remove duplicatas quando a mesma UA aparece em dois grupos", async () => {
            const userComDuplicata = makeUserComEscopo()
            userComDuplicata.opcoes_escopo.grupos.push({
                uo: {
                    id: 20,
                    codigo: "UO-20",
                    nome: "Unidade Orçamentária 20",
                    label: "UO-20 - SME2",
                    selecionavel: true,
                    unidade_administrativa_id: null,
                    unidade_orcamentaria_id: 20,
                },
                uas: [
                    {
                        id: 200,
                        codigo: "001",
                        nome: "Unidade Alpha",
                        label: "001 - UA",
                        unidade_administrativa_id: 1, // duplicata do grupo anterior
                        unidade_orcamentaria_id: 20,
                    },
                ],
            })
            await mockUseAuth(userComDuplicata)

            renderComponent({ scopedToUser: true })

            // id=1 deve aparecer apenas uma vez
            const itens = screen.getAllByTestId("select-item-1")
            expect(itens).toHaveLength(1)
        })

        it("renderiza lista vazia quando usuário não tem opcoes_escopo", async () => {
            await mockUseAuth({ ...makeUserComEscopo(), opcoes_escopo: null })

            renderComponent({ scopedToUser: true })

            expect(screen.queryByTestId("select-item-1")).not.toBeInTheDocument()
            expect(screen.queryByTestId("select-item-2")).not.toBeInTheDocument()
        })

        it("renderiza lista vazia quando user é null", async () => {
            await mockUseAuth(null)

            renderComponent({ scopedToUser: true })

            expect(screen.queryByTestId("select-item-1")).not.toBeInTheDocument()
        })
    })

    // -------------------------------------------------------------------------
    // Valor do select
    // -------------------------------------------------------------------------

    describe("valor do select", () => {

        beforeEach(async () => {
            await mockUseAuth(null)
        })

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
    })

    // -------------------------------------------------------------------------
    // Opções includeAll / placeholder
    // -------------------------------------------------------------------------

    describe("opções includeAll e placeholder", () => {

        beforeEach(async () => {
            await mockUseAuth(null)
        })

        it("exibe 'Todas as unidades' quando includeAll é true", () => {
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
    })

    // -------------------------------------------------------------------------
    // handleChange
    // -------------------------------------------------------------------------

    describe("handleChange", () => {

        beforeEach(async () => {
            await mockUseAuth(null)
        })

        it("chama onChange com o valor quando não é '__all__'", () => {
            const { onChange } = renderComponent()
            fireEvent.change(screen.getByTestId("select-input"), { target: { value: "3" } })
            expect(onChange).toHaveBeenCalledWith("3")
        })

        it("chama onChange com string vazia quando valor é '__all__'", () => {
            const { onChange } = renderComponent({ includeAll: true })
            // Aciona onValueChange("__all__") diretamente via botão oculto do mock
            fireEvent.click(screen.getByTestId("select-trigger-value"))
            expect(onChange).toHaveBeenCalledWith("")
        })
    })

    // -------------------------------------------------------------------------
    // Props estruturais
    // -------------------------------------------------------------------------

    describe("props estruturais", () => {

        beforeEach(async () => {
            await mockUseAuth(null)
        })

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
            expect(screen.getByTestId("select-value")).toHaveAttribute(
                "data-placeholder",
                "Selecione uma unidade"
            )
        })
    })
})