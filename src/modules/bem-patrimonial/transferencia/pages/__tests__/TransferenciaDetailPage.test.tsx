import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TransferenciaDetailPage from '../TransferenciaDetailPage'
import { transferenciaService } from '../../services/transferencia.service'
import { downloadBlobFile } from '@/lib/unidades-list-page'

vi.mock('../../services/transferencia.service', () => ({
  transferenciaService: {
    retrieve: vi.fn(),
    baixarDocumentoNtBpm: vi.fn(),
  },
}))

vi.mock('@/lib/unidades-list-page', () => ({
  downloadBlobFile: vi.fn(),
}))

const transferenciaMock = {
  id: 9,
  numero_ntbpm: '001.0000009.2026',
  numero_processo: '12345',
  observacao: 'Observação',
  criado_em: '2026-07-17T10:00:00-03:00',
  atualizado_em: '2026-07-17T10:10:00-03:00',
  total_itens: 1,
  unidade_orcamentaria_origem: {
    id: 10,
    codigo: '01.16.10',
    sigla: 'SME',
    nome: 'Secretaria',
    label: '01.16.10 - SME',
  },
  unidade_orcamentaria_destino: {
    id: 20,
    codigo: '99.01',
    sigla: 'DEST',
    nome: 'Destino',
    label: '99.01 - DEST',
  },
  unidade_administrativa_origem: {
    id: 100,
    codigo: '01.16.10.001',
    sigla: 'UA Origem',
    nome: 'UA Origem',
    label: '01.16.10.001 - UA Origem',
  },
  unidade_administrativa_destino: {
    id: 200,
    codigo: '99.01.001',
    sigla: 'UA Destino',
    nome: 'UA Destino',
    label: '99.01.001 - UA Destino',
  },
  criado_por: {
    id: 3,
    username: 'operador',
    nome_completo: 'Operador 1',
  },
  url_documento_ntbpm: '/api/documento-ntbpm/9/download/',
  itens: [
    {
      id: 1,
      bem: {
        id: 1,
        numero_patrimonial: '123',
        nome: 'Notebook',
      },
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(transferenciaService.retrieve).mockResolvedValue(transferenciaMock as never)
  vi.mocked(transferenciaService.baixarDocumentoNtBpm).mockResolvedValue(
    new Blob(['pdf'], { type: 'application/pdf' }),
  )
})

describe('TransferenciaDetailPage', () => {
  it('renderiza detalhes da transferência', async () => {
    render(
      <MemoryRouter initialEntries={['/transferencias/9']}>
        <Routes>
          <Route path='/transferencias/:id' element={<TransferenciaDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(transferenciaService.retrieve).toHaveBeenCalledWith(9)
    })

    expect(
      screen.getByRole('heading', { name: 'Visualizar Transferência de Bem Patrimonial' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Solicitação #0009')).toBeInTheDocument()
    expect(screen.getByText('001.0000009.2026')).toBeInTheDocument()
    expect(screen.getByText('12345')).toBeInTheDocument()
    expect(screen.getByText('Operador 1')).toBeInTheDocument()
    expect(screen.getByText('123 Notebook')).toBeInTheDocument()
  })

  it('baixa o documento NTBPM usando o blob retornado pela API', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/transferencias/9']}>
        <Routes>
          <Route path='/transferencias/:id' element={<TransferenciaDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Baixar NTBPM/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Baixar NTBPM/i }))

    await waitFor(() => {
      expect(transferenciaService.baixarDocumentoNtBpm).toHaveBeenCalledWith(
        '/api/documento-ntbpm/9/download/',
      )
      expect(downloadBlobFile).toHaveBeenCalledWith(
        expect.any(Blob),
        'ntbpm-0009.pdf',
      )
    })
  })
})
