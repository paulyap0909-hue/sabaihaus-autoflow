import { CalendarPlus } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { PageHeader } from '../components/PageHeader'
import { AttentionQueue } from '../modules/dashboard/AttentionQueue'
import { GrowthAdvisor } from '../modules/dashboard/GrowthAdvisor'
import { OperationsPulse } from '../modules/dashboard/OperationsPulse'
import { TherapistSnapshot } from '../modules/dashboard/TherapistSnapshot'
import { TodaySchedule } from '../modules/dashboard/TodaySchedule'
import { dashboardMetrics } from '../services/mockDashboard'

export function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Wednesday, 10 June"
        title="Good morning, Amelia."
        description="Here is how Sabai Haus is performing today, with the appointments, guest relationships, and revenue opportunities that need your attention."
        action={
          <button className="primary-button" type="button">
            <CalendarPlus size={16} />
            New appointment
          </button>
        }
      />

      <div className="dashboard-grid">
        <section className="metric-grid" aria-label="Business summary">
          {dashboardMetrics.map((metric) => (
            <MetricCard metric={metric} key={metric.label} />
          ))}
        </section>
        <OperationsPulse />
        <TodaySchedule />
        <GrowthAdvisor />
        <AttentionQueue />
        <TherapistSnapshot />
      </div>
    </>
  )
}
