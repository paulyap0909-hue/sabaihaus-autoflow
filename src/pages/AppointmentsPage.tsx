import { CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { AppointmentsModule } from '../modules/appointments/AppointmentsModule'

export function AppointmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <PageHeader
        eyebrow="Front desk intelligence"
        title="Appointment Intelligence Center"
        description="Coordinate therapist calendars, rooms, guest flow and revenue-aware treatment decisions from one calm workspace."
        action={<button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}><CalendarPlus size={16} /> New Appointment</button>}
      />
      <AppointmentsModule
        isCreateOpen={isCreateOpen}
        onCreateOpen={() => setIsCreateOpen(true)}
        onCreateClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
