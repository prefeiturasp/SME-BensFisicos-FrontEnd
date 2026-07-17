import { AxiosError } from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function primitiveMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number') return String(value)
  return null
}

function arrayMessage(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null
  return primitiveMessage(value[0])
}

function firstErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null

  const detail = primitiveMessage(data.detail)
  if (detail) return detail

  for (const value of Object.values(data)) {
    const message = arrayMessage(value) ?? primitiveMessage(value)
    if (message) return message
  }

  return null
}

export function handleApiError(error: unknown, defaultMessage: string): never {
  if (error instanceof AxiosError) {
    if (!error.response) {
      throw new Error('Erro de conexão com o servidor.')
    }

    const message = firstErrorMessage(error.response.data)
    if (message) {
      throw new Error(message)
    }

    throw new Error(defaultMessage)
  }

  throw error
}
