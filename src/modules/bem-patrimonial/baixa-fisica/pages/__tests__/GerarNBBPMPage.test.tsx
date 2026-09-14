import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { AxiosError } from "axios"

import GerarNBBPMPage from "../GerarNBBPMPage"
import { baixaFisicaService, downloadBlob } from "../../service/baixas.service"
import { useAuth } from "@/auth/useAuth"
import { toast } from "sonner"

// ===================== MOCKS =====================

const mockNavigate = vi.fn()
let mockLocationState: { baixaIds?: number[]; processo?: string } | null = null

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: mockLocationState }),
    }
})

vi.mock("@/auth/useAuth", () => ({
    useAuth: vi.fn(),
}))

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock("../../service/baixas.service", () => ({
    baixaFisicaService: {
        gerarNbbpmLote: vi.fn(),
        baixarNbbpmPdf: vi.fn(),
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
        target: { value: "Responsavel Teste" },
    })
}

function preencherSomenteCamposEditaveis() {
    fireEvent.change(screen.getByLabelText(/Data da Autorização/i), {
        target: { value: "2026-05-08" },
    })
    fireEvent.change(screen.getByLabelText(/Responsável/i), {
        target: { value: "Responsavel Teste" },
    })
}

function makeAxiosFieldError(data: Record<string, unknown>) {
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

function makeNbbpm(overrides = {}) {
    return {
        id: 1,
        numero: "001.0000001/2026",
        numero_processo_baixa: "6016.2025/0117371-7",
        baixas: [1, 2, 3],
        ...overrides,
    }
}

// ===================== TESTS =====================

describe("GerarNBBPMPage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockLocationState = { baixaIds: [1, 2, 3] }
        vi.mocked(useAuth).mockReturnValue({
            user: { rf: "1234567" },
        } as unknown as ReturnType<typeof useAuth>)
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
                target: { value: "Responsavel Teste" },
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
                target: { value: "Responsavel Teste" },
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
        it("chama o serviço com o payload correto, baixa o PDF, exibe toast de sucesso e volta", async () => {
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(makeNbbpm())
            const fakePdf = new Blob(["pdf"], { type: "application/pdf" })
            vi.mocked(baixaFisicaService.baixarNbbpmPdf).mockResolvedValueOnce(fakePdf)

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(baixaFisicaService.gerarNbbpmLote).toHaveBeenCalledWith({
                    baixas: [1, 2, 3],
                    numero_processo_baixa: "6016.2025/0117371-7",
                    data_autorizacao: "2026-05-08",
                    responsavel: "Responsavel Teste",
                    numero_processo_destinacao_final: "",
                })
            })

            expect(baixaFisicaService.baixarNbbpmPdf).toHaveBeenCalledWith(1)
            expect(downloadBlob).toHaveBeenCalledWith(
                fakePdf,
                "NBBPM_001.0000001/2026.pdf"
            )
            expect(toast.success).toHaveBeenCalledWith(
                "NBBPM 001.0000001/2026 gerada com sucesso!"
            )
            expect(mockNavigate).toHaveBeenCalledWith(-1)
        })

        it("conclui com toast de sucesso mesmo se o download do PDF falhar", async () => {
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(makeNbbpm())
            vi.mocked(baixaFisicaService.baixarNbbpmPdf).mockRejectedValueOnce(
                new Error("Erro ao baixar NBBPM.")
            )

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Erro ao baixar NBBPM.")
            })
            expect(toast.success).toHaveBeenCalledWith(
                "NBBPM 001.0000001/2026 gerada com sucesso!"
            )
            expect(mockNavigate).toHaveBeenCalledWith(-1)
        })

        it("envia o número do processo de destinação final quando preenchido", async () => {
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(makeNbbpm())

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
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(makeNbbpm())

            renderPage()
            fireEvent.change(screen.getByLabelText(/Número do processo de Baixa/i), {
                target: { value: "  6016.2025/0117371-7  " },
            })
            fireEvent.change(screen.getByLabelText(/Data da Autorização/i), {
                target: { value: "2026-05-08" },
            })
            fireEvent.change(screen.getByLabelText(/Responsável/i), {
                target: { value: "  Responsavel Teste  " },
            })

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(baixaFisicaService.gerarNbbpmLote).toHaveBeenCalledWith(
                    expect.objectContaining({
                        numero_processo_baixa: "6016.2025/0117371-7",
                        responsavel: "Responsavel Teste",
                    })
                )
            })
        })

        it("desabilita o botão e exibe 'Gerando...' durante o submit", async () => {
            let resolveGerar: (value: ReturnType<typeof makeNbbpm>) => void = () => {}
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockReturnValueOnce(
                new Promise((resolve) => {
                    resolveGerar = resolve
                })
            )

            renderPage()
            preencherFormularioValido()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(await screen.findByRole("button", { name: /Gerando\.\.\./i })).toBeDisabled()

            resolveGerar(makeNbbpm())

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
            expect(toast.error).toHaveBeenCalledWith(
                "Uma ou mais Baixas selecionadas não pertencem ao seu escopo de acesso."
            )
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

    describe("processo único vindo da listagem", () => {
        it("abre com o Número do processo preenchido e readOnly e o Gerado por com o RF logado e disabled", () => {
            mockLocationState = { baixaIds: [10, 11], processo: "6016.2025/0117371-7" }
            renderPage()

            const processoInput = screen.getByLabelText(/Número do processo de Baixa/i) as HTMLInputElement
            expect(processoInput.value).toBe("6016.2025/0117371-7")
            expect(processoInput).toHaveAttribute("readonly")

            const geradoPorInput = screen.getByLabelText(/Gerado por/i) as HTMLInputElement
            expect(geradoPorInput.value).toBe("1234567")
            expect(geradoPorInput).toBeDisabled()
        })

        it("mantém Responsável e Data da Autorização editáveis", () => {
            mockLocationState = { baixaIds: [10, 11], processo: "6016.2025/0117371-7" }
            renderPage()

            const responsavelInput = screen.getByLabelText(/Responsável/i) as HTMLInputElement
            const dataInput = screen.getByLabelText(/Data da Autorização/i) as HTMLInputElement

            expect(responsavelInput).not.toHaveAttribute("readonly")
            expect(responsavelInput).not.toBeDisabled()
            expect(dataInput).not.toHaveAttribute("readonly")
            expect(dataInput).not.toBeDisabled()
        })

        it("envia o processo travado do state sem precisar digitar", async () => {
            mockLocationState = { baixaIds: [10, 11], processo: "6016.2025/0117371-7" }
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockResolvedValueOnce(
                makeNbbpm({ baixas: [10, 11] })
            )

            renderPage()
            preencherSomenteCamposEditaveis()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            await waitFor(() => {
                expect(baixaFisicaService.gerarNbbpmLote).toHaveBeenCalledWith({
                    baixas: [10, 11],
                    numero_processo_baixa: "6016.2025/0117371-7",
                    data_autorizacao: "2026-05-08",
                    responsavel: "Responsavel Teste",
                    numero_processo_destinacao_final: "",
                })
            })
            expect(toast.success).toHaveBeenCalledWith(
                "NBBPM 001.0000001/2026 gerada com sucesso!"
            )
        })

        it("exibe toast com a mensagem de divergência do backend e não limpa o processo travado", async () => {
            const mensagemDivergencia = "As Baixas selecionadas possuem Números de Processo divergentes. A NBBPM só pode ser gerada com Baixas do mesmo Número de Processo."
            mockLocationState = { baixaIds: [10, 11], processo: "6016.2025/0117371-7" }
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockRejectedValueOnce(
                makeAxiosFieldError({ baixas: [mensagemDivergencia] })
            )

            renderPage()
            preencherSomenteCamposEditaveis()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(await screen.findByText(mensagemDivergencia)).toBeInTheDocument()
            expect(toast.error).toHaveBeenCalledWith(mensagemDivergencia)
            expect(mockNavigate).not.toHaveBeenCalled()
            expect((screen.getByLabelText(/Número do processo de Baixa/i) as HTMLInputElement).value).toBe(
                "6016.2025/0117371-7"
            )
        })

        it("exibe toast com a mensagem de numero_processo_baixa divergente do backend", async () => {
            const mensagem = "O Número do processo informado diverge do Número de Processo das Baixas selecionadas."
            mockLocationState = { baixaIds: [10, 11], processo: "6016.2025/0117371-7" }
            vi.mocked(baixaFisicaService.gerarNbbpmLote).mockRejectedValueOnce(
                makeAxiosFieldError({ numero_processo_baixa: [mensagem] })
            )

            renderPage()
            preencherSomenteCamposEditaveis()

            fireEvent.click(screen.getByRole("button", { name: /Gerar Baixa/i }))

            expect(await screen.findByText(mensagem)).toBeInTheDocument()
            expect(toast.error).toHaveBeenCalledWith(mensagem)
        })
    })
})