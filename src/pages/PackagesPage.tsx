import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CoreSetupModal } from '../components/CoreSetupModal'
import { PageHeader } from '../components/PageHeader'
import { SuccessToast } from '../components/SuccessToast'
import { PackagesModule } from '../modules/packages/PackagesModule'

export function PackagesPage() {
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
        title="Packages"
        description="Manage package definitions, customer balances, redemptions and expiry risk"
        action={<button className="primary-button" type="button" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Package</button>}
      />
      <PackagesModule refreshVersion={refreshVersion} />
      <CoreSetupModal kind="Package" open={modalOpen} onClose={() => setModalOpen(false)} onCreated={created} />
      <SuccessToast message={toast} onClose={() => setToast('')} />
    </>
  )
}
