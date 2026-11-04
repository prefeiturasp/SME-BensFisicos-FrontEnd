import { useCallback, useMemo, useState } from 'react'

import type { Bem } from '@/modules/bem-patrimonial/bem/services/bem.service'

export type BemSelectionRow = Readonly<{
  id: string
  bem: Bem | null
}>

function createBemSelectionRow(): BemSelectionRow {
  return { id: crypto.randomUUID(), bem: null }
}

export function useBemSelectionRows(onChange?: () => void, initialRows = 1) {
  const [rows, setRows] = useState<BemSelectionRow[]>(() =>
    Array.from({ length: initialRows }, createBemSelectionRow),
  )

  const allSelectedIds = useMemo(
    () => rows.filter((row) => row.bem).map((row) => row.bem!.id),
    [rows],
  )

  const handleSelectBem = useCallback((rowId: string, bem: Bem) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, bem } : row)))
    onChange?.()
  }, [onChange])

  const handleClearBem = useCallback((rowId: string) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, bem: null } : row)))
    onChange?.()
  }, [onChange])

  const handleRemoveBem = useCallback((rowId: string) => {
    setRows((prev) => {
      if (prev.length === 1) {
        return [createBemSelectionRow()]
      }

      return prev.filter((row) => row.id !== rowId)
    })
    onChange?.()
  }, [onChange])

  const handleAddBem = useCallback(() => {
    setRows((prev) => [...prev, createBemSelectionRow()])
    onChange?.()
  }, [onChange])

  return {
    rows,
    allSelectedIds,
    handleSelectBem,
    handleClearBem,
    handleRemoveBem,
    handleAddBem,
  }
}
