import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { CoreSetupModal } from '../components/CoreSetupModal'
import { PageHeader } from '../components/PageHeader'
import { SuccessToast } from '../components/SuccessToast'
import { TherapistsModule } from '../modules/therapists/TherapistsModule'

export function TherapistsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [toast, setToast] = useState('')

  const created = (message: string) => {
    setToast(message)
    setRefreshVersion((current) => current + 1)
  }

  return (
    <>
      <PageHeader
        title="Therapists"
        description="Coordinate availability, specialties, performance and therapist earnings"
        action={<button className="primary-button" type="button" onClick={() => setModalOpen(true)}><UserPlus size={16} /> Add Therapist</button>}
      />
      <TherapistsModule refreshVersion={refreshVersion} />
      <CoreSetupModal kind="Therapist" open={modalOpen} onClose={() => setModalOpen(false)} onCreated={created} />
      <SuccessToast message={toast} onClose={() => setToast('')} />
    </>
  )
}
