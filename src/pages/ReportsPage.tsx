import { ChartNoAxesCombined } from 'lucide-react'
import { PlaceholderPage } from '../components/PlaceholderPage'

export function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      description="Understand revenue, retention, therapist performance, package liability, and membership health without spreadsheet work."
      icon={ChartNoAxesCombined}
      actionLabel="Create report"
      features={['Revenue', 'Retention', 'Team performance', 'Package & membership health']}
    />
  )
}
