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

const TEMPLATE_XLSX_FILE_PATH = 'assets/template_importacao_bens.xlsx'

function baixarTemplate() {
    const a = document.createElement('a')
    a.href = TEMPLATE_XLSX_FILE_PATH
    a.download = 'template_importacao_bens.xlsx'
    a.click()
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