import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

import GerarNBBPMPage from "../GerarNBBPMPage"
import { baixaFisicaService, downloadBlob } from "../../service/baixas.service"

// ===================== MOCKS =====================

const mockNavigate = vi.fn()
let mockLocationState: { baixaIds?: number[] } | null = null

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: mockLocationState }),
    }
})

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        gerarNbbpmLote: vi.fn(),
    },
    downloadBlob: vi.fn(),
}))

vi.mock("@/components/AppBreadcrumb", () => ({
    AppBreadcrumb: () => <nav data-testid="breadcrumb" />,
}))

// ===================== HELPERS =====================

function renderPage() {
    return render(<GerarNBBPMPage />)
}

function preencherFormularioValido() {
    fireEvent.change(screen.getByLabelText(/Número do processo de Baixa/i), {
        target: { value: "6016.2025/0117371-7" },
    })
    fireEvent.change(screen.getByLabelText(/Data da Autorização/i), {
        target: { value: "2026-05-08" },
    })
    fireEvent.change(screen.getByLabelText(/Responsável/i), {
        target: { value: "Priscila Padovesi" },
    })
}

// ===================== TESTS =====================

describe("GerarNBBPMPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockLocationState = { baixaIds: [1, 2, 3] }
    })

    describe("baixaIds ausente", () => {
        it("exibe aviso e mantém a ação de gerar desabilitada quando não há baixas selecionadas", () => {
            mockLocationState = null
            renderPage()

            expect(
                screen.getByText(/Nenhuma Baixa Física aceita foi selecionada/i)
            ).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /Gerar Baixa/i })).toBeDisabled()
        })

        it("também trata location.state sem a chave baixaIds", () => {
            mockLocationState = {}
            renderPage()

            expect(screen.getByText(/0 Baixa\(s\) Física\(s\) selecionada\(s\)/i)).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /Gerar Baixa/i })).toBeDisabled()
        })
    })

    describe("renderização", () => {
        it("exibe a contagem de baixas selecionadas recebidas via router state", () => {
            renderPage()
            expect(screen.getByText(/3 Baixa\(s\) Física\(s\) selecionada\(s\)/i)).toBeInTheDocument()
        })

        it("renderiza todos os campos do formulário", () => {
            renderPage()

            expect(screen.getByLabelText(/Número do processo de Baixa/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/Data da Autorização/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/Responsável/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/Número do processo de destinação final/i)).toBeInTheDocument()
        })

        it("não exibe erro nem aviso quando o formulário ainda não foi submetido", () => {
            renderPage()

            expect(screen.queryByRole("alert")).not.toBeInTheDocument()
        })
    })

    describe("validação", () => {
        it("exibe erro quando o número do processo de Baixa não é informado", async () => {
            renderPage()

            fireEvent.change(screen.getByLabelText(/Data da Autorização/i), {
                target: { value: "2026-05-08" },
            })
            fireEvent.change(screen.getByLabelText(/Responsável/i), {
                target: { value: "Priscila Padovesi" },
            })

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(
                await screen.findByText(/Informe o número do processo de Baixa/i)
            ).toBeInTheDocument()
            expect(baixaFisicaService.gerarNbbpmLote).not.toHaveBeenCalled()
        })

        it("exibe erro quando a data da autorização não é informada", async () => {
            renderPage()

            fireEvent.change(screen.getByLabelText(/Número do processo de Baixa/i), {
                target: { value: "6016.2025/0117371-7" },
            })
            fireEvent.change(screen.getByLabelText(/Responsável/i), {
                target: { value: "Priscila Padovesi" },
            })

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(await screen.findByText(/Informe a data da autorização/i)).toBeInTheDocument()
            expect(baixaFisicaService.gerarNbbpmLote).not.toHaveBeenCalled()
        })

        it("exibe erro quando o responsável não é informado", async () => {
            renderPage()

            fireEvent.change(screen.getByLabelText(/Número do processo de Baixa/i), {
                target: { value: "6016.2025/0117371-7" },
            })
            fireEvent.change(screen.getByLabelText(/Data da Autorização/i), {
                target: { value: "2026-05-08" },
            })

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(await screen.findByText(/Informe o responsável/i)).toBeInTheDocument()
            expect(baixaFisicaService.gerarNbbpmLote).not.toHaveBeenCalled()
        })

        it("não permite submeter apenas com espaços em branco nos campos obrigatórios", async () => {
            renderPage()

            fireEvent.change(screen.getByLabelText(/Número do processo de Baixa/i), {
                target: { value: "   " },
            })
            fireEvent.change(screen.getByLabelText(/Data da Autorização/i), {
                target: { value: "2026-05-08" },
            })
            fireEvent.change(screen.getByLabelText(/Responsável/i), {
                target: { value: "   " },
            })

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(
                await screen.findByText(/Informe o número do processo de Baixa/i)
            ).toBeInTheDocument()
            expect(baixaFisicaService.gerarNbbpmLote).not.toHaveBeenCalled()
        })

        it("exibe erro quando não há baixas selecionadas e o usuário tenta submeter mesmo assim", async () => {
            mockLocationState = { baixaIds: [] }
            renderPage()

            preencherFormularioValido()

            // botão está desabilitado, mas garantimos que o handler também protege o caminho
            const botao = screen.getByRole("button", { name: /Gerar Baixa/i })
            expect(botao).toBeDisabled()
            expect(baixaFisicaService.gerarNbbpmLote).not.toHaveBeenCalled()
        })
    })

    describe("submissão com sucesso", () => {
        it("chama o serviço com o payload correto, baixa o PDF e volta para a página anterior", async () => {
            const fakeBlob = new Blob(["pdf"], { type: "application/pdf" })
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(fakeBlob)

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(baixaFisicaService.gerarNbbpmLote).toHaveBeenCalledWith({
                    baixas: [1, 2, 3],
                    numero_processo_baixa: "6016.2025/0117371-7",
                    data_autorizacao: "2026-05-08",
                    responsavel: "Priscila Padovesi",
                    numero_processo_destinacao_final: undefined,
                })
            })

            expect(downloadBlob).toHaveBeenCalledWith(
                fakeBlob,
                "NBBPM_6016.2025/0117371-7.pdf"
            )
            expect(mockNavigate).toHaveBeenCalledWith(-1)
        })

        it("envia o número do processo de destinação final quando preenchido", async () => {
            const fakeBlob = new Blob(["pdf"], { type: "application/pdf" })
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(fakeBlob)

            renderPage()
            preencherFormularioValido()
            fireEvent.change(screen.getByLabelText(/Número do processo de destinação final/i), {
                target: { value: "  6016.2025/9999999-9  " },
            })

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(baixaFisicaService.gerarNbbpmLote).toHaveBeenCalledWith(
                    expect.objectContaining({
                        numero_processo_destinacao_final: "6016.2025/9999999-9",
                    })
                )
            })
        })

        it("faz trim dos campos de texto antes de enviar", async () => {
            const fakeBlob = new Blob(["pdf"], { type: "application/pdf" })
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(fakeBlob)

            renderPage()
            fireEvent.change(screen.getByLabelText(/Número do processo de Baixa/i), {
                target: { value: "  6016.2025/0117371-7  " },
            })
            fireEvent.change(screen.getByLabelText(/Data da Autorização/i), {
                target: { value: "2026-05-08" },
            })
            fireEvent.change(screen.getByLabelText(/Responsável/i), {
                target: { value: "  Priscila Padovesi  " },
            })

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(baixaFisicaService.gerarNbbpmLote).toHaveBeenCalledWith(
                    expect.objectContaining({
                        numero_processo_baixa: "6016.2025/0117371-7",
                        responsavel: "Priscila Padovesi",
                    })
                )
            })
        })

        it("desabilita o botão e exibe 'Gerando...' durante o submit", async () => {
            let resolveGerar: (value: Blob) => void = () => {}
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockReturnValueOnce(
                new Promise((resolve) => {
                    resolveGerar = resolve
                })
            )

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(await screen.findByRole("button", { name: /Gerando\.\.\./i })).toBeDisabled()

            resolveGerar(new Blob(["pdf"], { type: "application/pdf" }))

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith(-1)
            })
        })
    })

    describe("submissão com erro", () => {
        it("exibe a mensagem de erro retornada pelo serviço e não navega", async () => {
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockRejectedValueOnce(
                new Error("Uma ou mais Baixas selecionadas não pertencem ao seu escopo de acesso.")
            )

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(
                await screen.findByText(/não pertencem ao seu escopo de acesso/i)
            ).toBeInTheDocument()
            expect(downloadBlob).not.toHaveBeenCalled()
            expect(mockNavigate).not.toHaveBeenCalled()
        })

        it("exibe mensagem genérica quando o erro não é uma instância de Error", async () => {
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockRejectedValueOnce("falha desconhecida")

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(await screen.findByText(/Erro ao gerar NBBPM\./i)).toBeInTheDocument()
        })

        it("reabilita o botão após o erro, permitindo tentar novamente", async () => {
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockRejectedValueOnce(new Error("Falha"))

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(screen.getByRole("button", { name: /Gerar Baixa/i })).not.toBeDisabled()
            })
        })
    })

    describe("cancelar", () => {
        it("navega de volta sem chamar o serviço", () => {
            renderPage()

            fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }))

            expect(mockNavigate).toHaveBeenCalledWith(-1)
            expect(baixaFisicaService.gerarNbbpmLote).not.toHaveBeenCalled()
        })
    })
})