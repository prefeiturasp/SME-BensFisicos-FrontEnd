import { Network, Upload, Trash2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { useBemImport } from '../hooks/useBemImport'

// ---------------------------------------------------------------------------
// Constantes de estilo — mesmas convenções do BensListPage
// ---------------------------------------------------------------------------

const BTN_PRIMARY =
    'h-10 px-6 bg-[#00703C] hover:bg-[#005a30] text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const BTN_OUTLINE =
    'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors'

const BTN_ATTACH =
    'h-10 px-5 bg-[#2F7D57] hover:bg-[#1f5c3e] text-white font-semibold rounded-md flex items-center gap-2 transition-colors'

// ---------------------------------------------------------------------------
// Template XLSX vazio embedado em base64
// Cabeçalho verde (#2F7D57) + texto branco, 30 linhas para preenchimento.
// Gerado em: 2026-05-29
// ---------------------------------------------------------------------------

const TEMPLATE_XLSX_B64 =
    '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'

function baixarTemplate() {
    const bytes = Uint8Array.from(atob(TEMPLATE_XLSX_B64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_importacao_bens.xlsx'
    a.click()
    URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Sub-componente: área de upload (estado idle ou erro)
// ---------------------------------------------------------------------------

interface AnexarDocumentoProps {
    readonly onSelect: (file: File) => void
    readonly inputRef: React.RefObject<HTMLInputElement>
}

function AnexarDocumento({ onSelect, inputRef }: AnexarDocumentoProps) {
    return (
        <>
            <input
                ref={inputRef}
                type='file'
                accept='.xlsx,.xls,.csv'
                className='hidden'
                onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) onSelect(file)
                }}
            />
            <button
                type='button'
                className={BTN_ATTACH}
                onClick={() => inputRef.current?.click()}
            >
                <Upload size={16} />
                Anexar Documento
            </button>
        </>
    )
}

// ---------------------------------------------------------------------------
// Sub-componente: arquivo selecionado
// ---------------------------------------------------------------------------

interface ArquivoAnexadoProps {
    readonly nome: string
    readonly onRemover: () => void
}

function ArquivoAnexado({ nome, onRemover }: ArquivoAnexadoProps) {
    return (
        <div className='flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 w-fit'>
            <Paperclip size={14} className='text-[#2F7D57] shrink-0' />
            <span className='text-sm text-[#2F7D57] font-medium'>{nome}</span>
            <button
                type='button'
                onClick={onRemover}
                className='text-gray-400 hover:text-red-500 transition-colors ml-1'
                aria-label='Remover arquivo'
            >
                <Trash2 size={14} />
            </button>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Sub-componente: tabela de erros
// ---------------------------------------------------------------------------

interface TabelaErrosProps {
    readonly erros: { linha: number; numero_patrimonial: string; tipo_erro: string }[]
    readonly onNovoUpload: () => void
    readonly inputRef: React.RefObject<HTMLInputElement>
    readonly onSelect: (file: File) => void
}

function TabelaErros({ erros, onNovoUpload, inputRef, onSelect }: TabelaErrosProps) {
    return (
        <div className='space-y-4'>
            <p className='text-sm font-semibold text-red-600'>
                Foram identificados os seguintes erros na planilha
            </p>
            <p className='text-sm text-gray-600'>
                Identificamos os seguintes erros na planilha. Por favor, faça a correção no
                arquivo e realize novo upload da carga completa.
            </p>

            {/* Botão de novo upload */}
            <input
                ref={inputRef}
                type='file'
                accept='.xlsx,.xls,.csv'
                className='hidden'
                onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) onSelect(file)
                }}
            />
            <button
                type='button'
                className={BTN_ATTACH}
                onClick={onNovoUpload}
            >
                <Upload size={16} />
                Anexar Documento
            </button>

            {/* Tabela */}
            <div className='overflow-x-auto overflow-y-auto max-h-[480px] border border-gray-200 rounded'>
                <table className='w-full text-sm'>
                    <thead className='bg-gray-50'>
                        <tr className='text-left text-gray-600 font-semibold border-b border-gray-200'>
                            <th className='px-4 py-3'>Linha do Arquivo</th>
                            <th className='px-4 py-3'>Número Patrimonial</th>
                            <th className='px-4 py-3'>Tipo de erro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {erros.map((erro) => (
                            <tr
                                key={`${erro.linha}-${erro.tipo_erro}`}
                                className='border-b border-gray-100 hover:bg-gray-50'
                            >
                                <td className='px-4 py-3'>{erro.linha}</td>
                                <td className='px-4 py-3'>{erro.numero_patrimonial}</td>
                                <td className='px-4 py-3'>{erro.tipo_erro}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Sub-componente: toast flutuante
// ---------------------------------------------------------------------------

interface ToastProps {
    readonly tipo: 'sucesso' | 'erro'
    readonly mensagem: string
}

function Toast({ tipo, mensagem }: ToastProps) {
    const bg = tipo === 'sucesso' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
    const icon = tipo === 'sucesso' ? '\u2713' : '\u2717'
    const iconColor = tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'
    const title = tipo === 'sucesso' ? 'Importação realizada' : 'Importação não realizada'
    const titleColor = tipo === 'sucesso' ? 'text-green-700' : 'text-red-700'

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-start gap-3 border rounded-md px-4 py-3 shadow-md max-w-sm ${bg}`}
            role='alert'
        >
            <span className={`text-lg font-bold mt-0.5 ${iconColor}`}>{icon}</span>
            <div>
                <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
                <p className='text-sm text-gray-600 mt-0.5'>{mensagem}</p>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function BemImportPage() {
    const {
        estado,
        arquivo,
        importando,
        inputRef,
        selecionarArquivo,
        removerArquivo,
        novoUpload,
        importar,
        cancelar,
    } = useBemImport()

    const podeImportar =
        estado.tipo === 'arquivo_selecionado' && !importando

    const mostrarTabela =
        estado.tipo === 'erro_parcial' || estado.tipo === 'erro_total'
    const errosExibidos =
        estado.tipo === 'erro_parcial' || estado.tipo === 'erro_total'
            ? estado.erros
            : []

    const mensagemToastErro = (() => {
        if (estado.tipo === 'erro_total') return estado.detail
        if (estado.tipo === 'erro_parcial') return estado.resultado.detail
        return ''
    })()

    return (
        <div className='p-8 space-y-4'>
            {/* Toast flutuante */}
            {estado.tipo === 'sucesso' && (
                <Toast tipo='sucesso' mensagem={estado.resultado.detail} />
            )}
            {(estado.tipo === 'erro_total' || estado.tipo === 'erro_parcial') && (
                <Toast tipo='erro' mensagem={mensagemToastErro} />
            )}
            {estado.tipo === 'erro_request' && (
                <Toast tipo='erro' mensagem={estado.mensagem} />
            )}

            {/* Breadcrumb */}
            <AppBreadcrumb
                items={[
                    { label: 'Bem Patrimonial', icon: Network },
                    { label: 'Bens Patrimoniais', href: '/bens-patrimoniais' },
                    { label: 'Importar Bens Patrimoniais', isActive: true },
                ]}
            />

            {/* Header */}
            <div className='flex items-center justify-between'>
                <h1 className='text-xl font-bold tracking-tight text-gray-700'>
                    Importar Bens Patrimoniais
                </h1>

                <div className='flex items-center gap-3'>
                    <Button
                        type='button'
                        onClick={importar}
                        disabled={!podeImportar}
                        className={BTN_PRIMARY}
                    >
                        {importando ? 'Importando...' : 'Importar'}
                    </Button>

                    <Button
                        type='button'
                        onClick={cancelar}
                        className={BTN_OUTLINE}
                    >
                        Cancelar
                    </Button>
                </div>
            </div>

            {/* Card */}
            <Card className='p-6 space-y-4'>
                {mostrarTabela ? (
                    <TabelaErros
                        erros={errosExibidos}
                        onNovoUpload={novoUpload}
                        inputRef={inputRef}
                        onSelect={selecionarArquivo}
                    />
                ) : (
                    <>
                        <div className='space-y-1'>
                            <p className='text-sm font-semibold text-[#2F7D57]'>
                                Adicionar Bens Patrimoniais em lote
                            </p>
                            <p className='text-sm text-gray-600'>
                                Realize o upload de arquivo Excel com o modelo de planilha padrão{' '}
                                <button
                                    type='button'
                                    onClick={baixarTemplate}
                                    className='text-[#2F7D57] underline hover:text-[#1f5c3e] text-sm'
                                >
                                    [clique aqui para baixar o modelo]
                                </button>{' '}
                                para realizar a importação.
                            </p>
                        </div>
                        <div className='w-1/3'>
                            {arquivo ? (
                                <ArquivoAnexado
                                    nome={arquivo.name}
                                    onRemover={removerArquivo}
                                />
                            ) : (
                                <AnexarDocumento
                                    onSelect={selecionarArquivo}
                                    inputRef={inputRef}
                                />
                            )}
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}