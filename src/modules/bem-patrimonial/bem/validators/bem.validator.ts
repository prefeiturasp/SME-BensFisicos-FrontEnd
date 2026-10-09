import { BEM_LIMITS, erroLimiteMaximo } from '../utils/bem-limits'
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

  validarNome(errors, data.nome)
  validarNumeroPatrimonial(errors, data.numero_patrimonial)
  validarLocalizacao(errors, data.localizacao)
  validarTextosOpcionais(errors, data)
  validarValor(errors, data.valor_unitario)

  return errors
}

function validarNome(errors: ValidationErrors, nome?: string): void {
  if (!nome || nome.trim().length < 3) {
    errors.nome = 'Nome deve ter no mínimo 3 caracteres.'
    return
  }
  const erro = erroLimiteMaximo(nome, BEM_LIMITS.nome)
  if (erro) errors.nome = erro
}

function validarNumeroPatrimonial(
  errors: ValidationErrors,
  numero?: string | null
): void {
  if (!numero || numero.trim() === '') {
    errors.numero_patrimonial = 'Número patrimonial é obrigatório.'
    return
  }
  const erro = erroLimiteMaximo(numero, BEM_LIMITS.numero_patrimonial)
  if (erro) errors.numero_patrimonial = erro
}

function validarLocalizacao(
  errors: ValidationErrors,
  localizacao?: string
): void {
  if (!localizacao || localizacao.trim() === '') {
    errors.localizacao = 'Localização é obrigatória.'
    return
  }
  const erro = erroLimiteMaximo(localizacao, BEM_LIMITS.localizacao)
  if (erro) errors.localizacao = erro
}

function validarTextosOpcionais(errors: ValidationErrors, data: BemFormData): void {
  const erroMarca = erroLimiteMaximo(data.marca, BEM_LIMITS.marca)
  if (erroMarca) errors.marca = erroMarca
  const erroModelo = erroLimiteMaximo(data.modelo, BEM_LIMITS.modelo)
  if (erroModelo) errors.modelo = erroModelo
  const erroProcesso = erroLimiteMaximo(
    data.numero_processo,
    BEM_LIMITS.numero_processo
  )
  if (erroProcesso) errors.numero_processo = erroProcesso
  if (data.descricao && data.descricao.length < 5) {
    errors.descricao = 'Descrição deve ter pelo menos 5 caracteres.'
    return
  }
  const erroDescricao = erroLimiteMaximo(data.descricao, BEM_LIMITS.descricao)
  if (erroDescricao) errors.descricao = erroDescricao
}

function validarValor(
  errors: ValidationErrors,
  valor?: number | string
): void {
  if (valor === undefined || valor === '') return
  const texto = String(valor).trim()
  if (texto.includes('-') || /[a-zA-Z]/.test(texto)) {
    errors.valor_unitario = MENSAGEM_VALOR_INVALIDO
    return
  }
  const numero = parseValorUnitario(texto)
  if (Number.isNaN(numero) || numero < 0) {
    errors.valor_unitario = MENSAGEM_VALOR_INVALIDO
  }
}