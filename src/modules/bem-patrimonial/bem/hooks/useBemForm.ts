import { useState, useEffect } from 'react'
import { bemService, type Bem } from '../services/bem.service'
import { validateBem } from '../validators/bem.validator'

export function useBemForm(initialData: Bem | null) {
  const [formData, setFormData] = useState<Bem | null>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // 🔥 sincroniza quando carregar o bem
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleChange = (field: keyof Bem, value: any) => {
    if (!formData) return

    setFormData(prev => prev ? { ...prev, [field]: value } : prev)

    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  const handleSubmit = async (id: number) => {
    if (!formData) return false

    const validationErrors = validateBem(formData)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return false
    }

    setSaving(true)

    try {
      await bemService.update(id, formData)
      return true
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data)
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    formData,
    errors,
    saving,
    handleChange,
    handleSubmit
  }
}