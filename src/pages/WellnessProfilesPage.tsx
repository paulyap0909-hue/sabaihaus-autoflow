import { ClipboardPlus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { WellnessProfilesModule } from '../modules/wellness/WellnessProfilesModule'

export function WellnessProfilesPage() {
  return (
    <>
      <PageHeader
        title="Wellness Profiles"
        description="Track changing wellbeing signals, care risks and treatment progress"
        action={<button className="primary-button" type="button"><ClipboardPlus size={16} /> New Assessment</button>}
      />
      <WellnessProfilesModule />
    </>
  )
}
