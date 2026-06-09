import { Settings } from 'lucide-react'
import { PlaceholderPage } from '../components/PlaceholderPage'

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Configure the business profile, branches, service catalog, operating hours, rooms, and future team permissions."
      icon={Settings}
      actionLabel="Add branch"
      features={['Business details', 'Branches', 'Services', 'Operating hours']}
    />
  )
}
