import type { ReactNode } from 'react'

import { AppBreadcrumb, type BreadcrumbItemProps } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

const PRIMARY_BUTTON_CLASS =
  'h-10 px-6 bg-[#00703C] hover:bg-[#005a30] text-white font-semibold rounded-md'

type BemCadastroPageShellProps = Readonly<{
  breadcrumbItems: BreadcrumbItemProps[]
  title: string
  onCancel: () => void
  onSave: () => void
  canSave: boolean
  submitting: boolean
  error: string | null
  saveLabel?: string
  cancelLabel?: string
  children: ReactNode
}>

export function BemCadastroPageShell(props: BemCadastroPageShellProps) {
  const {
    breadcrumbItems,
    title,
    onCancel,
    onSave,
    canSave,
    submitting,
    error,
    saveLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    children,
  } = props

  return (
    <div className='p-8 space-y-4'>
      <AppBreadcrumb items={breadcrumbItems} />

      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>{title}</h1>

        <div className='flex items-center gap-3'>
          <Button type='button' onClick={onCancel} className={ACTION_BUTTON_CLASS}>
            {cancelLabel}
          </Button>
          <Button
            type='button'
            onClick={onSave}
            disabled={!canSave}
            className={`${PRIMARY_BUTTON_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? 'Salvando...' : saveLabel}
          </Button>
        </div>
      </div>

      {error ? (
        <div
          className='text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2'
          role='alert'
        >
          {error}
        </div>
      ) : null}

      <Card className='p-6 space-y-4'>{children}</Card>
    </div>
  )
}
