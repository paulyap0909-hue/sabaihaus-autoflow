import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { getSystemHealthReport } from '../services/repositories/systemHealthRepository'
import type {
  SystemHealthCheck,
  SystemHealthReport,
} from '../types/systemHealth'

const statusIcons = {
  green: CheckCircle2,
  yellow: TriangleAlert,
  red: CircleAlert,
}

function formatDate(value: string | null) {
  if (!value) return 'No records'
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function HealthRow({ check }: { check: SystemHealthCheck }) {
  const Icon = statusIcons[check.indicator]
  return (
    <article className={`system-health-row is-${check.indicator}`}>
      <div className="system-health-table">
        <span><Database size={16} /></span>
        <div><strong>{check.label}</strong><code>{check.tableName}</code></div>
      </div>
      <div className="system-health-status">
        <span><Icon size={14} /> {check.status}</span>
        <small>{check.message}</small>
      </div>
      <div><span>Record count</span><strong>{check.recordCount?.toLocaleString() ?? 'Unavailable'}</strong></div>
      <div><span>Last created</span><strong>{formatDate(check.lastCreatedAt)}</strong></div>
      <div><span>Query latency</span><strong>{check.latencyMs} ms</strong></div>
    </article>
  )
}

export function SystemHealthPage() {
  const [report, setReport] = useState<SystemHealthReport | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setReport(await getSystemHealthReport())
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    void getSystemHealthReport().then((nextReport) => {
      if (active) {
        setReport(nextReport)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const healthy = report?.checks.filter((item) => item.indicator === 'green').length ?? 0
  const warnings = report?.checks.filter((item) => item.indicator === 'yellow').length ?? 0
  const errors = report?.checks.filter((item) => item.indicator === 'red').length ?? 0

  return (
    <>
      <PageHeader
        eyebrow="Temporary admin verification"
        title="System Health"
        description="Live schema and query verification for Google Calendar and Phase 4.8 communication infrastructure."
        action={
          <button className="primary-button" type="button" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={loading ? 'is-spinning' : ''} size={15} />
            {loading ? 'Checking...' : 'Run verification'}
          </button>
        }
      />

      <section className="system-health-summary">
        <article><span><ShieldCheck size={18} /></span><div><small>Overall status</small><strong>{report?.overallStatus ?? 'Checking'}</strong></div></article>
        <article><span><CheckCircle2 size={18} /></span><div><small>Healthy</small><strong>{healthy}</strong></div></article>
        <article><span><TriangleAlert size={18} /></span><div><small>Warnings</small><strong>{warnings}</strong></div></article>
        <article><span><CircleAlert size={18} /></span><div><small>Errors</small><strong>{errors}</strong></div></article>
      </section>

      <section className="records-panel system-health-panel">
        <div className="records-header">
          <div>
            <span className="panel-kicker">Database verification</span>
            <h2 className="panel-title">Integration Tables</h2>
          </div>
          <div className="system-health-meta">
            <span><Activity size={13} /> {report?.source ?? 'Checking configuration'}</span>
            <span><Clock3 size={13} /> {report ? formatDate(report.checkedAt) : 'Running now'}</span>
          </div>
        </div>
        <div className="system-health-list">
          {report?.checks.map((check) => (
            <HealthRow check={check} key={check.id} />
          ))}
          {!report && <div className="system-health-loading">Querying system tables...</div>}
        </div>
      </section>
    </>
  )
}
