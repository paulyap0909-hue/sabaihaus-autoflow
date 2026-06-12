import {
  BrainCircuit,
  BriefcaseBusiness,
  CalendarRange,
  CircleDollarSign,
  PackageOpen,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { businessIntelligenceSnapshot } from '../../services/mockBusinessIntelligence'
import {
  loadBusinessIntelligence,
  type BusinessIntelligenceQuery,
} from '../../services/repositories/businessIntelligenceRepository'
import type {
  BusinessIntelligenceResult,
  BusinessIntelligenceSection,
} from '../../types/businessIntelligence'
import { AiInsightsView } from './AiInsightsView'
import { CustomerIntelligenceView } from './CustomerIntelligenceView'
import { ExecutiveDashboard } from './ExecutiveDashboard'
import { ExecutiveBriefView } from './ExecutiveBriefView'
import { buildManagementBrain } from './managementBrain'
import { PackageIntelligenceView } from './PackageIntelligenceView'
import { RevenueIntelligenceView } from './RevenueIntelligenceView'
import { TherapistIntelligenceView } from './TherapistIntelligenceView'

const sections: Array<{
  label: BusinessIntelligenceSection
  icon: typeof BriefcaseBusiness
}> = [
  { label: 'Executive Dashboard', icon: BriefcaseBusiness },
  { label: 'Executive Brief', icon: BrainCircuit },
  { label: 'Therapist Intelligence', icon: Sparkles },
  { label: 'Customer Intelligence', icon: UsersRound },
  { label: 'Package Intelligence', icon: PackageOpen },
  { label: 'Revenue Intelligence', icon: CircleDollarSign },
  { label: 'AI Insights', icon: BrainCircuit },
]

const periodQueries: Record<string, BusinessIntelligenceQuery> = {
  'June 2026': {
    periodStart: '2026-06-01T00:00:00+08:00',
    periodEnd: '2026-06-12T23:59:59+08:00',
    comparisonPeriodStart: '2026-05-01T00:00:00+08:00',
    comparisonPeriodEnd: '2026-05-12T23:59:59+08:00',
  },
  'May 2026': {
    periodStart: '2026-05-01T00:00:00+08:00',
    periodEnd: '2026-05-31T23:59:59+08:00',
    comparisonPeriodStart: '2026-04-01T00:00:00+08:00',
    comparisonPeriodEnd: '2026-04-30T23:59:59+08:00',
  },
  'Q2 2026': {
    periodStart: '2026-04-01T00:00:00+08:00',
    periodEnd: '2026-06-12T23:59:59+08:00',
    comparisonPeriodStart: '2026-01-01T00:00:00+08:00',
    comparisonPeriodEnd: '2026-03-14T23:59:59+08:00',
  },
  'Year to date': {
    periodStart: '2026-01-01T00:00:00+08:00',
    periodEnd: '2026-06-12T23:59:59+08:00',
    comparisonPeriodStart: '2025-01-01T00:00:00+08:00',
    comparisonPeriodEnd: '2025-06-12T23:59:59+08:00',
  },
}

export function BusinessIntelligenceCenter() {
  const [activeSection, setActiveSection] =
    useState<BusinessIntelligenceSection>('Executive Dashboard')
  const [period, setPeriod] = useState('June 2026')
  const [result, setResult] = useState<BusinessIntelligenceResult>({
    snapshot: businessIntelligenceSnapshot,
    source: 'mock',
    sourceLabel: 'Mock intelligence fallback',
    statusLabel: 'Mock Fallback Active',
    fallbackReason: 'Loading Supabase intelligence configuration.',
  })
  const query = useMemo(() => periodQueries[period], [period])

  useEffect(() => {
    let active = true

    void loadBusinessIntelligence(query).then((nextResult) => {
      if (active) {
        setResult(nextResult)
      }
    })

    return () => {
      active = false
    }
  }, [query])

  const snapshot = result.snapshot
  const managementBrain = useMemo(
    () => buildManagementBrain(snapshot),
    [snapshot],
  )

  return (
    <div className="business-intelligence-center">
      <section className="bi-command-bar">
        <div className="bi-section-tabs" role="tablist" aria-label="Business intelligence sections">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                className={activeSection === section.label ? 'is-active' : ''}
                type="button"
                role="tab"
                aria-selected={activeSection === section.label}
                onClick={() => setActiveSection(section.label)}
                key={section.label}
              >
                <Icon size={15} />
                {section.label}
              </button>
            )
          })}
        </div>
        <div className="bi-period-control">
          <CalendarRange size={15} />
          <label>
            <span>Reporting period</span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              aria-label="Reporting period"
            >
              {Object.keys(periodQueries).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="bi-context-line">
        <span>Sabai Haus · Mont Kiara</span>
        <span>
          Executive snapshot generated{' '}
          {new Date(snapshot.generatedAt).toLocaleString('en-MY')}
        </span>
        <span
          className={`bi-data-status is-${result.source}`}
          title={result.fallbackReason}
        >
          {result.statusLabel} · {result.sourceLabel}
        </span>
      </div>

      {activeSection === 'Executive Dashboard' && (
        <ExecutiveDashboard snapshot={snapshot} />
      )}
      {activeSection === 'Executive Brief' && (
        <ExecutiveBriefView brain={managementBrain} />
      )}
      {activeSection === 'Therapist Intelligence' && (
        <TherapistIntelligenceView therapists={snapshot.therapists} />
      )}
      {activeSection === 'Customer Intelligence' && (
        <CustomerIntelligenceView
          atRiskCustomers={snapshot.atRiskCustomers}
          segments={snapshot.customerSegments}
        />
      )}
      {activeSection === 'Package Intelligence' && (
        <PackageIntelligenceView liabilities={snapshot.packageLiabilities} />
      )}
      {activeSection === 'Revenue Intelligence' && (
        <RevenueIntelligenceView
          forecast={snapshot.revenueForecast}
          revenueMix={snapshot.revenueMix}
        />
      )}
      {activeSection === 'AI Insights' && (
        <AiInsightsView
          insights={snapshot.aiInsights}
          generatedAt={snapshot.generatedAt}
        />
      )}
    </div>
  )
}
