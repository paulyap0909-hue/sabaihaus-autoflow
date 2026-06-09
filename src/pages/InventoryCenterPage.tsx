import { PackagePlus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { InventoryCenterModule } from '../modules/inventory/InventoryCenterModule'

export function InventoryCenterPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Inventory Center"
        description="Track oils, consumables, retail products, suppliers and service usage"
        action={<button className="primary-button" type="button" onClick={() => setDrawerOpen(true)}><PackagePlus size={16} /> Add Stock Item</button>}
      />
      <InventoryCenterModule drawerOpen={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
