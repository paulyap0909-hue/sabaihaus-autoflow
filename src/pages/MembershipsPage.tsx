import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CoreSetupModal } from '../components/CoreSetupModal'
import { PageHeader } from '../components/PageHeader'
import { SuccessToast } from '../components/SuccessToast'
import { MembershipsModule } from '../modules/memberships/MembershipsModule'

export function MembershipsPage() {
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
        title="Memberships"
        description="Manage membership tiers, benefits, usage and renewal relationships"
        action={<button className="primary-button" type="button" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Membership</button>}
      />
      <MembershipsModule refreshVersion={refreshVersion} />
      <CoreSetupModal kind="Membership" open={modalOpen} onClose={() => setModalOpen(false)} onCreated={created} />
      <SuccessToast message={toast} onClose={() => setToast('')} />
    </>
  )
}
