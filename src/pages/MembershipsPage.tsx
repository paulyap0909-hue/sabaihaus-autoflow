import { Plus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { MembershipsModule } from '../modules/memberships/MembershipsModule'

export function MembershipsPage() {
  return (
    <>
      <PageHeader
        title="Memberships"
        description="Manage membership tiers, benefits, usage and renewal relationships"
        action={<button className="primary-button" type="button"><Plus size={16} /> Add Membership</button>}
      />
      <MembershipsModule />
    </>
  )
}
