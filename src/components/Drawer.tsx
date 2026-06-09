import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface DrawerProps {
  open: boolean
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Drawer({
  open,
  title,
  eyebrow,
  onClose,
  children,
  footer,
  wide = false,
}: DrawerProps) {
  if (!open) return null

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close drawer" />
      <aside className={`drawer ${wide ? 'drawer-wide' : ''}`} aria-modal="true" role="dialog" aria-label={title}>
        <header className="drawer-header">
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button className="drawer-close" type="button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </div>
  )
}
