import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { CustomersModule } from '../modules/customers/CustomersModule'

export function CustomersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage client profiles, visit history and retention opportunities"
        action={<button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}><UserPlus size={16} /> New Customer</button>}
      />
      <CustomersModule
        isCreateOpen={isCreateOpen}
        onCreateOpen={() => setIsCreateOpen(true)}
        onCreateClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
