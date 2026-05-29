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
                accept='.xlsx,.xls'
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
    readonly erros: { linha: number; numero_patrimonial: string; campo: string; tipo_erro: string }[]
    readonly onNovoUpload: () => void
    readonly inputRef: React.RefObject<HTMLInputElement>
    readonly onSelect: (file: File) => void
}

function TabelaErros({ erros, onNovoUpload, inputRef, onSelect }: TabelaErrosProps) {
    return (
        <div className='space-y-4'>
            <p className='text-sm font-semibold text-red-600'>
                Foram identificados erros na planilha
            </p>
            <p className='text-sm text-gray-600'>
                Identificamos os seguintes erros na planilha. Por favor, faça a correção no
                arquivo e realize novo upload da carga completa.
            </p>

            {/* Botão de novo upload */}
            <input
                ref={inputRef}
                type='file'
                accept='.xlsx,.xls'
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
                            <th className='px-4 py-3'>Campo</th>
                            <th className='px-4 py-3'>Tipo de erro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {erros.map((erro, idx) => (
                            <tr
                                key={`${erro.linha}-${erro.campo}-${idx}`}
                                className='border-b border-gray-100 hover:bg-gray-50'
                            >
                                <td className='px-4 py-3'>{erro.linha}</td>
                                <td className='px-4 py-3'>{erro.numero_patrimonial}</td>
                                <td className='px-4 py-3'>{erro.campo}</td>
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

    const mostrarTabela = estado.tipo === 'erro_total'
    const errosExibidos = estado.tipo === 'erro_total' ? estado.erros : []

    const mensagemToastErro = estado.tipo === 'erro_total' ? estado.detail : ''

    return (
        <div className='p-8 space-y-4'>
            {/* Toast flutuante */}
            {estado.tipo === 'sucesso' && (
                <Toast tipo='sucesso' mensagem={estado.resultado.detail} />
            )}
            {estado.tipo === 'erro_total' && (
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
                    { label: 'Importação de carga de Bens Patrimoniais', isActive: true },
                ]}
            />

            {/* Header */}
            <div className='flex items-center justify-between'>
                <h1 className='text-xl font-bold tracking-tight text-gray-700'>
                    Importação de carga de Bens Patrimoniais
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