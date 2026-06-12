import { BrainCircuit } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { BusinessIntelligenceCenter } from '../modules/businessIntelligence/BusinessIntelligenceCenter'

export function ReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Executive intelligence"
        title="Business Intelligence Center"
        description="Turn revenue, customer behavior, therapist performance and future obligations into clear management decisions for the whole wellness business."
        action={
          <span className="bi-header-badge">
            <BrainCircuit size={15} />
            Wellness OS intelligence
          </span>
        }
      />
      <BusinessIntelligenceCenter />
    </>
  )
}
