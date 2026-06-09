import { Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { CommissionCenterModule } from '../modules/commissions/CommissionCenterModule'

export function CommissionCenterPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Commission Center"
        description="Track therapist earnings, rules, bonuses and payroll-ready payouts"
        action={<button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}><Plus size={16} /> Add Commission Rule</button>}
      />
      <CommissionCenterModule
        isCreateOpen={isCreateOpen}
        onCreateOpen={() => setIsCreateOpen(true)}
        onCreateClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
