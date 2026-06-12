import {
  ArrowRight,
  CalendarCheck2,
  Clock3,
  Crown,
  MessageCircleMore,
  PackageOpen,
  RefreshCw,
  WalletCards,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildMockActionCenterSnapshot } from '../../services/mockActionCenter'
import { loadActionCenter } from '../../services/repositories/actionCenterRepository'
import type { ActionCenterSnapshot } from '../../types/actionCenter'

export function CustomerActionCenter() {
  const [snapshot, setSnapshot] = useState<ActionCenterSnapshot>(
    buildMockActionCenterSnapshot(),
  )

  useEffect(() => {
    let active = true
    const refresh = () => {
      loadActionCenter().then((result) => {
        if (active) setSnapshot(result)
      })
    }
    refresh()
    const intervalId = window.setInterval(refresh, 60_000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  const actions = [
    { label: 'Rebooking', value: snapshot.summary.rebooking, icon: CalendarCheck2 },
    { label: 'Package renewals', value: snapshot.summary.packageRenewals, icon: PackageOpen },
    { label: 'Membership renewals', value: snapshot.summary.membershipRenewals, icon: RefreshCw },
    { label: 'VIP at risk', value: snapshot.summary.vipAtRisk, icon: Crown },
    { label: 'Pending follow-ups', value: snapshot.summary.pendingFollowUps, icon: Clock3 },
    { label: 'Messages pending', value: snapshot.summary.pendingMessages, icon: MessageCircleMore },
  ]

  return (
    <section className="customer-action-center panel">
      <div className="records-header">
        <div>
          <span className="panel-kicker">Front desk execution</span>
          <h2 className="panel-title">Today's Action Center</h2>
        </div>
        <span className={`action-data-source ${snapshot.source === 'live' ? 'is-live' : ''}`}>
          {snapshot.sourceLabel}
        </span>
      </div>

      <div className="dashboard-action-layout">
        <article className="revenue-opportunity-widget">
          <span className="revenue-opportunity-icon"><WalletCards size={20} /></span>
          <div>
            <small>Today's Revenue Opportunities</small>
            <strong>RM {Math.round(snapshot.summary.estimatedRevenue).toLocaleString()}</strong>
            <p>{snapshot.summary.totalActions} actions · {snapshot.summary.urgentActions} urgent</p>
          </div>
          <a className="primary-button" href="/action-center">
            Open Action Center <ArrowRight size={15} />
          </a>
        </article>

        <div className="dashboard-action-counts">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <article key={action.label}>
                <span><Icon size={16} /></span>
                <div><small>{action.label}</small><strong>{action.value}</strong></div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
