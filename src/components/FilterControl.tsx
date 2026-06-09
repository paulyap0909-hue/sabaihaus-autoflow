import type { ReactNode } from 'react'

interface FilterControlProps {
  label: string
  children: ReactNode
}

export function FilterControl({ label, children }: FilterControlProps) {
  return (
    <label className="filter-control">
      <span>{label}</span>
      {children}
    </label>
  )
}
