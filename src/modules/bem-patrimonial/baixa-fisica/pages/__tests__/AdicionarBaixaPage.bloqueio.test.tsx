import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { AxiosError } from "axios"
import { toast } from "sonner"
import AdicionarBaixaPage from "../AdicionarBaixaPage"
import { baixaFisicaService } from "../../service/baixas.service"
import { bemService } from "../../../bem/services/bem.service"
import type { Bem } from "../../../bem/services/bem.service"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: { create: vi.fn() },
}))

vi.mock("../../../bem/services/bem.service", () => ({
    bemService: { list: vi.fn() },
}))

vi.mock("../../components/UnidadeAdministrativaSelect", () => ({
    UnidadeAdministrativaSelect: ({ onChange, value }: { onChange: (v: string) => void; value: string }) => (
        <select data-testid="unidade-select" value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Selecione</option>
            <option value="1">UA-01</option>
        </select>
    ),
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

vi.mock("@/components/ui/date-picker", () => ({
    DatePicker: ({ value, onChange, ariaLabel, id }: { value?: Date; onChange: (d: Date | undefined) => void; ariaLabel?: string; id?: string }) => (
        <input
            data-testid="data-baixa-picker"
            id={id}
            aria-label={ariaLabel}
            type="date"
            value={value ? "2024-01-01" : ""}
            onChange={() => onChange(value)}
        />
    ),
}))

function makeBem(): Bem {
    return {
        id: 1,
        status: "aprovado",
        status_display: "Aprovado",
        nome: "Cadeira Escritório",
        descricao: "Cadeira ergonômica",
        numero_patrimonial: "PAT-001",
        numero_formato_antigo: false,
        sem_numeracao: false,
        localizacao: "Sala 01",
        unidade_administrativa_codigo: "001",
        unidade_administrativa_nome: "Unidade 01",
        unidade_orcamentaria_nome: "UO-01",
    } as Bem
}

function axios400(data: unknown) {
    const err = new AxiosError("Request failed with status code 400")
    err.response = { status: 400, data, headers: {}, config: {} as never, statusText: "" }
    return err
}

function renderPage() {
    return render(
        <MemoryRouter>
            <AdicionarBaixaPage />
        </MemoryRouter>
    )
}

async function selectBem() {
    fireEvent.change(screen.getByTestId("unidade-select"), { target: { value: "1" } })
    fireEvent.focus(screen.getByPlaceholderText("Selecione um bem"))
    await waitFor(() => screen.getByText("Cadeira Escritório"))
    fireEvent.click(screen.getByText("Cadeira Escritório"))
}

const MENSAGEM_BLOQUEIO =
    "Já existe baixa em aberto para esta unidade. Conclua ou recuse a baixa existente antes de criar uma nova."

describe("AdicionarBaixaPage — bloqueio baixa em aberto", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(bemService.list).mockResolvedValue({
            results: [makeBem()],
            count: 1,
            next: null,
            previous: null,
        } as never)
    })

    it("cria válida (201) sem exibir bloqueio", async () => {
        vi.mocked(baixaFisicaService.create).mockResolvedValue({ id: 70 } as never)
        renderPage()
        await selectBem()
        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => expect(baixaFisicaService.create).toHaveBeenCalled())
        expect(toast.success).toHaveBeenCalledWith("Baixa Física cadastrada com sucesso.")
        expect(mockNavigate).toHaveBeenCalledWith(-1)
        expect(screen.queryByTestId("bloqueio-baixa-existente")).not.toBeInTheDocument()
    })

    it("400 final com 1 id string: mensagem + toast + 1 link com Number()", async () => {
        const mensagemCompleta = `${MENSAGEM_BLOQUEIO} Consulte a baixa existente.`
        vi.mocked(baixaFisicaService.create).mockRejectedValue(
            axios400({
                unidade_administrativa_origem: [MENSAGEM_BLOQUEIO, "Consulte a baixa existente."],
                baixas_existentes: ["63"],
            })
        )
        renderPage()
        await selectBem()
        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => expect(screen.getByTestId("bloqueio-baixa-existente")).toBeInTheDocument())
        expect(screen.getByText(mensagemCompleta)).toBeInTheDocument()
        expect(toast.error).toHaveBeenCalledWith(mensagemCompleta)
        const link = screen.getByRole("link", { name: "Abrir Baixa #63" })
        expect(link.getAttribute("href")).toBe("/baixas-fisicas/63")
        expect(screen.queryByRole("link", { name: "Abrir Baixa #22" })).not.toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it("400 final com N ids strings: lista todos os links com Number()", async () => {
        vi.mocked(baixaFisicaService.create).mockRejectedValue(
            axios400({
                unidade_administrativa_origem: [MENSAGEM_BLOQUEIO],
                baixas_existentes: ["22", "23"],
            })
        )
        renderPage()
        await selectBem()
        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => expect(screen.getByTestId("bloqueio-baixa-existente")).toBeInTheDocument())
        expect(toast.error).toHaveBeenCalledWith(MENSAGEM_BLOQUEIO)
        expect(screen.getByRole("link", { name: "Abrir Baixa #22" }).getAttribute("href")).toBe("/baixas-fisicas/22")
        expect(screen.getByRole("link", { name: "Abrir Baixa #23" }).getAttribute("href")).toBe("/baixas-fisicas/23")
    })

    it("400 genérico sem array mantém fallback sem links", async () => {
        vi.mocked(baixaFisicaService.create).mockRejectedValue(axios400({ itens: ["Obrigatório"] }))
        renderPage()
        await selectBem()
        fireEvent.click(screen.getByText("Solicitar"))

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Request failed with status code 400"))
        expect(screen.queryByTestId("bloqueio-baixa-existente")).not.toBeInTheDocument()
    })
})
