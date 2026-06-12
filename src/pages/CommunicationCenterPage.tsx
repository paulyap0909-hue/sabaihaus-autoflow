import { PageHeader } from '../components/PageHeader'
import { CommunicationCenterModule } from '../modules/communication/CommunicationCenterModule'

export function CommunicationCenterPage() {
  return (
    <>
      <PageHeader
        title="Communication Center"
        description="Manage WhatsApp, email and SMS engagement, message queues, rebooking and renewal opportunities"
      />
      <CommunicationCenterModule />
    </>
  )
}
