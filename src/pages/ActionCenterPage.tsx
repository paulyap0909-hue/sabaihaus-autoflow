import { PageHeader } from '../components/PageHeader'
import { ActionCenterModule } from '../modules/actionCenter/ActionCenterModule'

export function ActionCenterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Daily execution workspace"
        title="Front Desk Action Center"
        description="Prioritize rebooking, renewals, VIP recovery and customer messages from one clear operational view."
      />
      <ActionCenterModule />
    </>
  )
}
