import { Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { NotificationCenterModule } from '../modules/notifications/NotificationCenterModule'

export function NotificationCenterPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Notification Center"
        description="Automate appointment reminders, follow-ups, renewals and customer recovery"
        action={<button className="primary-button" type="button" onClick={() => setDrawerOpen(true)}><Plus size={16} /> Create Template</button>}
      />
      <NotificationCenterModule drawerOpen={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
