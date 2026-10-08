import { BEM_LIMITS, mensagemLimiteMaximo } from '../utils/bem-limits'
import {
  MENSAGEM_VALOR_INVALIDO,
  parseValorUnitario,
} from '../utils/valor-monetario'

export interface BemFormData {
  nome?: string
  descricao?: string
  numero_patrimonial?: string | null
  localizacao?: string
  valor_unitario?: number | string
  marca?: string
  modelo?: string
  numero_processo?: string
  status?: string
}

export interface ValidationErrors {
  [key: string]: string
}

export function validateBem(data: BemFormData): ValidationErrors {
  const errors: ValidationErrors = {}

  // 🔒 BLOQUEIO BAIXA FÍSICA
  if (data.status === 'baixa_fisica') {
    errors._global =
      'Este bem está com status "Baixa Física" e não pode ser editado.'
    return errors
  }

  // 📌 Nome obrigatório
  if (!data.nome || data.nome.trim().length < 3) {
    errors.nome = 'Nome deve ter no mínimo 3 caracteres.'
  } else if (data.nome.trim().length > BEM_LIMITS.nome) {
    errors.nome = mensagemLimiteMaximo(BEM_LIMITS.nome)
  }

  // 📌 Número patrimonial obrigatório
  if (!data.numero_patrimonial || data.numero_patrimonial.trim() === '') {
    errors.numero_patrimonial = 'Número patrimonial é obrigatório.'
  } else if (
    data.numero_patrimonial.trim().length > BEM_LIMITS.numero_patrimonial
  ) {
    errors.numero_patrimonial = mensagemLimiteMaximo(
      BEM_LIMITS.numero_patrimonial
    )
  }

  // 📌 Localização obrigatória
  if (!data.localizacao || data.localizacao.trim() === '') {
    errors.localizacao = 'Localização é obrigatória.'
  } else if (data.localizacao.trim().length > BEM_LIMITS.localizacao) {
    errors.localizacao = mensagemLimiteMaximo(BEM_LIMITS.localizacao)
  }

  if (data.marca && data.marca.trim().length > BEM_LIMITS.marca) {
    errors.marca = mensagemLimiteMaximo(BEM_LIMITS.marca)
  }
  if (data.modelo && data.modelo.trim().length > BEM_LIMITS.modelo) {
    errors.modelo = mensagemLimiteMaximo(BEM_LIMITS.modelo)
  }
  if (
    data.numero_processo &&
    data.numero_processo.trim().length > BEM_LIMITS.numero_processo
  ) {
    errors.numero_processo = mensagemLimiteMaximo(BEM_LIMITS.numero_processo)
  }

  // 📌 Valor deve ser número positivo no formato 0,00 ou 0.000,00
  if (data.valor_unitario !== undefined && data.valor_unitario !== '') {
    const texto = String(data.valor_unitario).trim()
    if (texto.includes('-') || /[a-zA-Z]/.test(texto)) {
      errors.valor_unitario = MENSAGEM_VALOR_INVALIDO
    } else {
      const valor = parseValorUnitario(texto)
      if (Number.isNaN(valor) || valor < 0) {
        errors.valor_unitario = MENSAGEM_VALOR_INVALIDO
      }
    }
  }

  // 📌 Descrição opcional mas mínima se preenchida
  if (data.descricao && data.descricao.length < 5) {
    errors.descricao =
      'Descrição deve ter pelo menos 5 caracteres.'
  } else if (data.descricao && data.descricao.length > BEM_LIMITS.descricao) {
    errors.descricao = mensagemLimiteMaximo(BEM_LIMITS.descricao)
  }

  return errors
}