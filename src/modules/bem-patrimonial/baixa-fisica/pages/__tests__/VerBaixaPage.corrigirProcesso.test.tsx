import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { AxiosError } from "axios"

import VerBaixaPage from "../VerBaixaPage"
import { baixaFisicaService } from "../../service/baixas.service"
import { useAuth } from "@/auth/useAuth"
import { toast } from "sonner"
import type { BaixaFisicaDetail } from "../../types/baixas-fisicas.types"

// ===================== MOCKS =====================

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/auth/useAuth", () => ({
    useAuth: vi.fn(),
}))

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}))

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        retrieve: vi.fn(),
        update: vi.fn(),
        aprovar: vi.fn(),
        corrigirProcesso: vi.fn(),
        recusar: vi.fn(),
        baixarNbbpmPdf: vi.fn(),
        gerarLaudo: vi.fn(),
        historico: vi.fn(),
    },
}))

vi.mock("../../../bem/services/bem.service", () => ({
    bemService: { list: vi.fn().mockResolvedValue({ results: [], count: 0, next: null, previous: null }) },
}))

vi.mock("../../modals/HistoricoModal", () => ({
    default: () => <div data-testid="historico-modal" />,
}))

vi.mock("../../modals/ConfirmarAceiteModal", () => ({
    default: () => <div data-testid="confirmar-aceite-modal" />,
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ===================== FACTORIES =====================

function makeBaixaDetail(overrides: Partial<BaixaFisicaDetail> = {}): BaixaFisicaDetail {
    return {
        id: 1,
        status: "aceita",
        status_display: "Aceita",
        numero_processo_baixa: "6016.2025/0000000-0",
        numero_nbbpm: null,
        data_criacao: "2024-01-15T10:00:00Z",
        data_baixa: "2024-01-15",
        aprovado_por: null,
        data_aprovacao: null,
        unidade_administrativa_origem: {
            id: 1,
            sigla: "UA-01",
            codigo: "001",
            nome: "Unidade 01",
            status: "active",
        },
        criado_por: {
            id: 1,
            nome_completo: "João Silva",
            username: "joao.silva",
            email: "joao@email.com",
            rf: "1234567",
        },
        itens: [],
        url_solicitar: null,
        url_aprovar: null,
        url_recusar: null,
        url_solicitar_correcao: null,
        url_gerar_nbbpm: null,
        url_gerar_laudo: null,
        ...overrides,
    }
}

function mockGestor() {
    vi.mocked(useAuth).mockReturnValue({
        user: { id: 1, is_gestor_patrimonio: true, is_superuser: false },
    } as unknown as ReturnType<typeof useAuth>)
}

function mockOperador() {
    vi.mocked(useAuth).mockReturnValue({
        user: { id: 2, is_gestor_patrimonio: false, is_superuser: false },
    } as unknown as ReturnType<typeof useAuth>)
}

function renderPage(id = "1") {
    return render(
        <MemoryRouter initialEntries={[`/baixas-fisicas/${id}`]}>
            <Routes>
                <Route path="/baixas-fisicas/:id" element={<VerBaixaPage />} />
            </Routes>
        </MemoryRouter>
    )
}

function makeAxios400(data: Record<string, unknown>) {
    const error = new AxiosError("Request failed with status code 400")
    error.response = {
        status: 400,
        data,
        headers: {},
        config: {} as never,
        statusText: "",
    }
    return error
}

// ===================== TESTS =====================

describe("VerBaixaPage — corrigir número do processo", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGestor()
        vi.mocked(baixaFisicaService.historico).mockResolvedValue([])
    })

    it("exibe o valor atual e o botão só para gestor em baixa aceita sem NBBPM", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()

        await waitFor(() =>
            expect(screen.getByText("6016.2025/0000000-0")).toBeInTheDocument()
        )
        expect(screen.getByText("Corrigir Processo")).toBeInTheDocument()
    })

    it("não exibe o botão para operador", async () => {
        mockOperador()
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        renderPage()

        await waitFor(() => expect(screen.getByText(/Aceita/)).toBeInTheDocument())
        expect(screen.queryByText("Corrigir Processo")).not.toBeInTheDocument()
    })

    it("não exibe o botão quando já há NBBPM gerada", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ numero_nbbpm: "NBBPM-001" })
        )
        renderPage()

        await waitFor(() => expect(screen.getByText("NBBPM-001")).toBeInTheDocument())
        expect(screen.queryByText("Corrigir Processo")).not.toBeInTheDocument()
    })

    it("não exibe o botão quando o status não é aceita", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(
            makeBaixaDetail({ status: "solicitada", status_display: "Solicitada" })
        )
        renderPage()

        await waitFor(() =>
            expect(screen.getByText("Validar Baixa Física de Bem Patrimonial")).toBeInTheDocument()
        )
        expect(screen.queryByText("Corrigir Processo")).not.toBeInTheDocument()
    })

    it("salva o novo número válido e atualiza o detalhe sem criar nova solicitação", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        vi.mocked(baixaFisicaService.corrigirProcesso).mockResolvedValue(
            makeBaixaDetail({ numero_processo_baixa: "6016.2025/0117371-7" })
        )
        renderPage()

        await waitFor(() => expect(screen.getByText("Corrigir Processo")).toBeInTheDocument())
        fireEvent.click(screen.getByText("Corrigir Processo"))

        await waitFor(() =>
            expect(screen.getByText("Corrigir número do processo")).toBeInTheDocument()
        )

        fireEvent.change(screen.getByLabelText("Novo número do processo"), {
            target: { value: "6016202501173717" },
        })
        fireEvent.click(screen.getByText("Salvar"))

        await waitFor(() =>
            expect(baixaFisicaService.corrigirProcesso).toHaveBeenCalledWith(1, {
                numero_processo_baixa: "6016.2025/0117371-7",
            })
        )
        await waitFor(() =>
            expect(toast.success).toHaveBeenCalledWith("Número do processo atualizado com sucesso.")
        )
        await waitFor(() =>
            expect(screen.getByText("6016.2025/0117371-7")).toBeInTheDocument()
        )
        expect(baixaFisicaService.create).toBeUndefined()
    })

    it("exibe erro de formato do backend em toast e fecha o modal", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        vi.mocked(baixaFisicaService.corrigirProcesso).mockRejectedValue(
            makeAxios400({ numero_processo_baixa: ["Formato inválido."] })
        )
        renderPage()

        await waitFor(() => expect(screen.getByText("Corrigir Processo")).toBeInTheDocument())
        fireEvent.click(screen.getByText("Corrigir Processo"))
        await waitFor(() => expect(screen.getByLabelText("Novo número do processo")).toBeInTheDocument())

        fireEvent.change(screen.getByLabelText("Novo número do processo"), {
            target: { value: "6016202501173717" },
        })
        fireEvent.click(screen.getByText("Salvar"))

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith("Formato inválido.")
        )
        await waitFor(() =>
            expect(screen.queryByText("Corrigir número do processo")).not.toBeInTheDocument()
        )
    })

    it("exibe erro de Nota já gerada em toast e fecha o modal", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        vi.mocked(baixaFisicaService.corrigirProcesso).mockRejectedValue(
            makeAxios400({
                detail: "Esta baixa já possui Nota (NBBPM) gerada e não pode ter o número alterado.",
            })
        )
        renderPage()

        await waitFor(() => expect(screen.getByText("Corrigir Processo")).toBeInTheDocument())
        fireEvent.click(screen.getByText("Corrigir Processo"))
        await waitFor(() => expect(screen.getByLabelText("Novo número do processo")).toBeInTheDocument())

        fireEvent.change(screen.getByLabelText("Novo número do processo"), {
            target: { value: "6016202501173717" },
        })
        fireEvent.click(screen.getByText("Salvar"))

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                "Esta baixa já possui Nota (NBBPM) gerada e não pode ter o número alterado."
            )
        )
        await waitFor(() =>
            expect(screen.queryByText("Corrigir número do processo")).not.toBeInTheDocument()
        )
    })

    it("trata 403 sem permissão com toast e fecha o modal", async () => {
        vi.mocked(baixaFisicaService.retrieve).mockResolvedValue(makeBaixaDetail())
        vi.mocked(baixaFisicaService.corrigirProcesso).mockRejectedValue(
            new Error("Apenas Gestor de Patrimônio pode corrigir o número do processo.")
        )
        renderPage()

        await waitFor(() => expect(screen.getByText("Corrigir Processo")).toBeInTheDocument())
        fireEvent.click(screen.getByText("Corrigir Processo"))
        await waitFor(() => expect(screen.getByLabelText("Novo número do processo")).toBeInTheDocument())

        fireEvent.change(screen.getByLabelText("Novo número do processo"), {
            target: { value: "6016202501173717" },
        })
        fireEvent.click(screen.getByText("Salvar"))

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                "Apenas Gestor de Patrimônio pode corrigir o número do processo."
            )
        )
        await waitFor(() =>
            expect(screen.queryByText("Corrigir número do processo")).not.toBeInTheDocument()
        )
    })
})
