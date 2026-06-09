import { UserPlus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { TherapistsModule } from '../modules/therapists/TherapistsModule'

export function TherapistsPage() {
  return (
    <>
      <PageHeader
        title="Therapists"
        description="Coordinate availability, specialties, performance and therapist earnings"
        action={<button className="primary-button" type="button"><UserPlus size={16} /> Add Therapist</button>}
      />
      <TherapistsModule />
    </>
  )
}
