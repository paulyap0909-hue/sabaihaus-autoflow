import { CheckCircle2, X } from 'lucide-react'

interface SuccessToastProps {
  message: string
  onClose: () => void
}

export function SuccessToast({ message, onClose }: SuccessToastProps) {
  if (!message) return null
  return (
    <div className="success-toast" role="status">
      <CheckCircle2 size={18} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss"><X size={15} /></button>
    </div>
  )
}
