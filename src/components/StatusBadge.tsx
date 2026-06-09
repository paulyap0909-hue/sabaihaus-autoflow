interface StatusBadgeProps {
  label: string
}

export function StatusBadge({ label }: StatusBadgeProps) {
  const tone =
    label === 'Checked In' ? 'gold' : label === 'Confirmed' ? 'neutral' : ''

  return <span className={`status-badge ${tone}`}>{label}</span>
}
