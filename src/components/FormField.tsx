import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
  full?: boolean
}

export function FormField({ label, children, full = false }: FormFieldProps) {
  return (
    <label className={`form-field ${full ? 'form-field-full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}
