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
  }

  // 📌 Número patrimonial obrigatório
  if (!data.numero_patrimonial || data.numero_patrimonial.trim() === '') {
    errors.numero_patrimonial = 'Número patrimonial é obrigatório.'
  }

  // 📌 Localização obrigatória
  if (!data.localizacao || data.localizacao.trim() === '') {
    errors.localizacao = 'Localização é obrigatória.'
  }

  // 📌 Valor deve ser número positivo
  if (data.valor_unitario !== undefined && data.valor_unitario !== '') {
    const valor = Number(data.valor_unitario)
    if (isNaN(valor) || valor < 0) {
      errors.valor_unitario = 'Valor unitário deve ser um número positivo.'
    }
  }

  // 📌 Descrição opcional mas mínima se preenchida
  if (data.descricao && data.descricao.length < 5) {
    errors.descricao =
      'Descrição deve ter pelo menos 5 caracteres.'
  }

  return errors
}