import { Plus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { PackagesModule } from '../modules/packages/PackagesModule'

export function PackagesPage() {
  return (
    <>
      <PageHeader
        title="Packages"
        description="Manage package definitions, customer balances, redemptions and expiry risk"
        action={<button className="primary-button" type="button"><Plus size={16} /> Sell Package</button>}
      />
      <PackagesModule />
    </>
  )
}
