import { AxiosError } from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function primitiveMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number') return String(value)
  return null
}

export function extractApiErrorMessage(data: unknown): string | null {
  const primitive = primitiveMessage(data)
  if (primitive) return primitive

  let values: unknown[] = []
  if (Array.isArray(data)) {
    values = data
  } else if (isRecord(data)) {
    values = Object.values(data)
  }
  const messages = values
    .map(extractApiErrorMessage)
    .filter((message): message is string => Boolean(message))

  return messages.length ? [...new Set(messages)].join(' ') : null
}

export function handleApiError(error: unknown, defaultMessage: string): never {
  if (error instanceof AxiosError) {
    if (!error.response) {
      throw new Error('Erro de conexão com o servidor.')
    }

    const message = extractApiErrorMessage(error.response.data)
    if (message) {
      throw new Error(message)
    }

    throw new Error(defaultMessage)
  }

  throw error
}
