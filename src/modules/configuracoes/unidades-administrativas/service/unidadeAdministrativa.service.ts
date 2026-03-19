import { api } from '@/api/http'

export interface UnidadeAdministrativa {
  id: number
  codigo: string
  nome: string
  sigla: string
  unidade_orcamentaria: number | null
}

export const unidadeAdministrativaService = {

  async list() {
    const { data } = await api.get("/unidades-administrativas/")
    return data
  }

}