import {
  CalendarClock,
  Check,
  CircleAlert,
  Copy,
  Crown,
  Eye,
  MessageCircleMore,
  PackageCheck,
  RefreshCw,
  Send,
  Sparkles,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  completeAction,
  loadActionCenter,
  updateActionMessageStatus,
} from '../../services/repositories/actionCenterRepository'
import { buildMockActionCenterSnapshot } from '../../services/mockActionCenter'
import type {
  ActionCenterSnapshot,
  ActionCenterTab,
  FrontDeskMessageAction,
  FrontDeskRebookingAction,
  FrontDeskRenewalAction,
  VipRescueAction,
} from '../../types/actionCenter'

const tabs: ActionCenterTab[] = [
  'Today',
  'Rebooking',
  'Renewals',
  'VIP Rescue',
  'Messages',
  'Completed',
]

const money = (value: number) => `RM ${Math.round(value).toLocaleString()}`
const dateLabel = (value: string) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? value || 'To be scheduled'
    : parsed.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

function refreshSummary(snapshot: ActionCenterSnapshot): ActionCenterSnapshot {
  const rebooking = snapshot.rebooking.filter((item) => item.status !== 'Completed')
  const renewals = snapshot.renewals.filter((item) => item.status !== 'Completed')
  const vipRescue = snapshot.vipRescue.filter((item) => item.status !== 'Completed')
  return {
    ...snapshot,
    summary: {
      ...snapshot.summary,
      rebooking: rebooking.length,
      packageRenewals: renewals.filter((item) => item.renewalType === 'Package').length,
      membershipRenewals: renewals.filter((item) => item.renewalType === 'Membership').length,
      vipAtRisk: vipRescue.length,
      pendingMessages: snapshot.messages.filter((item) =>
        ['Scheduled', 'Pending'].includes(item.status),
      ).length,
      estimatedRevenue:
        rebooking.reduce((sum, item) => sum + item.estimatedRevenue, 0) +
        renewals.reduce((sum, item) => sum + item.expectedRevenue, 0),
      urgentActions: [...rebooking, ...renewals, ...vipRescue].filter(
        (item) =>
          ('riskScore' in item ? item.riskScore : item.priorityScore) >= 80,
      ).length,
      totalActions: rebooking.length + renewals.length + vipRescue.length,
    },
  }
}

function Priority({ score }: { score: number }) {
  return (
    <span className={`action-priority ${score >= 80 ? 'is-urgent' : ''}`}>
      {Math.round(score)} priority
    </span>
  )
}

export function ActionCenterModule() {
  const [activeTab, setActiveTab] = useState<ActionCenterTab>('Today')
  const [snapshot, setSnapshot] = useState<ActionCenterSnapshot>(
    buildMockActionCenterSnapshot(),
  )
  const [preview, setPreview] = useState<FrontDeskMessageAction | null>(null)
  const [notice, setNotice] = useState('')

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

  const completedCount = useMemo(
    () =>
      snapshot.rebooking.filter((item) => item.status === 'Completed').length +
      snapshot.renewals.filter((item) => item.status === 'Completed').length +
      snapshot.vipRescue.filter((item) => item.status === 'Completed').length,
    [snapshot],
  )

  async function updateOpportunity(
    kind: 'Rebooking' | 'Renewal' | 'VIP Rescue',
    item: FrontDeskRebookingAction | FrontDeskRenewalAction | VipRescueAction,
    status: 'Contacted' | 'Completed' | 'Renewed',
    message: string,
  ) {
    try {
      await completeAction(
        kind,
        { id: item.id, customerId: item.customerId, phone: item.phone, message },
        status,
      )
      setSnapshot((current) => {
        const nextStatus = status === 'Contacted' ? 'Contacted' : 'Completed'
        const key =
          kind === 'Rebooking'
            ? 'rebooking'
            : kind === 'Renewal'
              ? 'renewals'
              : 'vipRescue'
        return refreshSummary({
          ...current,
          [key]: current[key].map((record) =>
            record.id === item.id ? { ...record, status: nextStatus } : record,
          ),
        })
      })
      setNotice(`${item.customerName} marked as ${status.toLowerCase()}.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The action could not be updated.')
    }
  }

  async function updateMessage(item: FrontDeskMessageAction, status: 'Sent' | 'Failed') {
    try {
      await updateActionMessageStatus(item, status)
      setSnapshot((current) =>
        refreshSummary({
          ...current,
          messages: current.messages.map((record) =>
            record.id === item.id ? { ...record, status } : record,
          ),
        }),
      )
      setNotice(`${item.purpose} marked ${status.toLowerCase()}.`)
      setPreview(null)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The message could not be updated.')
    }
  }

  const openRebooking = snapshot.rebooking.filter((item) => item.status !== 'Completed')
  const openRenewals = snapshot.renewals.filter((item) => item.status !== 'Completed')
  const openVip = snapshot.vipRescue.filter((item) => item.status !== 'Completed')
  const todayRebooking = activeTab === 'Today' ? openRebooking.slice(0, 3) : openRebooking
  const todayRenewals = activeTab === 'Today' ? openRenewals.slice(0, 3) : openRenewals
  const todayVip = activeTab === 'Today' ? openVip.slice(0, 2) : openVip

  const summaryCards = [
    ['Rebooking', snapshot.summary.rebooking, CalendarClock],
    ['Package renewals', snapshot.summary.packageRenewals, PackageCheck],
    ['Membership renewals', snapshot.summary.membershipRenewals, RefreshCw],
    ['VIP at risk', snapshot.summary.vipAtRisk, Crown],
    ['Pending follow-ups', snapshot.summary.pendingFollowUps, UsersRound],
    ['Messages pending', snapshot.summary.pendingMessages, Send],
    ['Revenue opportunity', money(snapshot.summary.estimatedRevenue), WalletCards],
  ] as const

  return (
    <div className="action-center">
      <section className="action-center-hero">
        <div>
          <span className="panel-kicker">Front desk execution</span>
          <h2>Today's Action Center</h2>
          <p>One calm workspace for the customer conversations that protect retention and revenue.</p>
        </div>
        <div className="action-center-source">
          <span className={snapshot.source === 'live' ? 'is-live' : ''} />
          <div>
            <strong>{snapshot.sourceLabel}</strong>
            <small>{snapshot.fallbackReason || 'Tenant-scoped operational data is active.'}</small>
          </div>
        </div>
      </section>

      <section className="action-summary-grid">
        {summaryCards.map(([label, value, Icon], index) => (
          <article className={index === 6 ? 'is-revenue' : ''} key={label}>
            <span><Icon size={18} /></span>
            <small>{label}</small>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="action-center-workspace">
        <div className="action-tabs" role="tablist" aria-label="Action Center views">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab ? 'is-active' : ''}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              key={tab}
            >
              {tab}
              {tab === 'Completed' && <span>{completedCount}</span>}
            </button>
          ))}
        </div>

        {notice && (
          <div className="action-notice">
            <Check size={15} />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button>
          </div>
        )}

        {(activeTab === 'Today' || activeTab === 'Rebooking') && (
          <ActionSection title="Rebooking opportunities" count={openRebooking.length}>
            {todayRebooking.map((item) => (
              <article className="front-desk-action-card" key={item.id}>
                <header>
                  <div className="action-customer">
                    <span>{item.customerName.charAt(0)}</span>
                    <div><strong>{item.customerName}</strong><small>{item.daysInactive} days inactive</small></div>
                  </div>
                  <Priority score={item.priorityScore} />
                </header>
                <div className="action-detail-grid">
                  <div><small>Last visit</small><strong>{dateLabel(item.lastVisitDate)}</strong></div>
                  <div><small>Last service</small><strong>{item.lastService}</strong></div>
                  <div><small>Preferred therapist</small><strong>{item.preferredTherapist}</strong></div>
                  <div><small>Suggested date</small><strong>{dateLabel(item.suggestedDate)}</strong></div>
                </div>
                <div className="action-value-line"><span>Estimated revenue</span><strong>{money(item.estimatedRevenue)}</strong></div>
                <footer>
                  <a className="whatsapp-button" href={whatsappUrl(item.phone, item.suggestedMessage)} target="_blank" rel="noreferrer">
                    <MessageCircleMore size={15} /> WhatsApp
                  </a>
                  <button className="secondary-button" type="button" onClick={() => updateOpportunity('Rebooking', item, 'Contacted', item.suggestedMessage)}>Mark contacted</button>
                  <button className="primary-button" type="button" onClick={() => updateOpportunity('Rebooking', item, 'Completed', item.suggestedMessage)}>Complete</button>
                </footer>
              </article>
            ))}
          </ActionSection>
        )}

        {(activeTab === 'Today' || activeTab === 'Renewals') && (
          <ActionSection title="Renewal opportunities" count={openRenewals.length}>
            {todayRenewals.map((item) => (
              <article className="front-desk-action-card" key={item.id}>
                <header>
                  <div className="action-customer">
                    <span>{item.renewalType === 'Package' ? <PackageCheck size={18} /> : <Sparkles size={18} />}</span>
                    <div><strong>{item.customerName}</strong><small>{item.renewalType} · {item.itemName}</small></div>
                  </div>
                  <Priority score={item.priorityScore} />
                </header>
                <div className="action-detail-grid">
                  <div><small>Product</small><strong>{item.itemName}</strong></div>
                  <div><small>Remaining sessions</small><strong>{item.remainingSessions ?? 'Member plan'}</strong></div>
                  <div><small>Expiry / renewal</small><strong>{dateLabel(item.expiryDate)}</strong></div>
                  <div><small>Expected renewal</small><strong>{money(item.expectedRevenue)}</strong></div>
                </div>
                <p className="suggested-message">{item.suggestedMessage}</p>
                <footer>
                  <a className="whatsapp-button" href={whatsappUrl(item.phone, item.suggestedMessage)} target="_blank" rel="noreferrer">
                    <MessageCircleMore size={15} /> WhatsApp
                  </a>
                  <button className="secondary-button" type="button" onClick={() => updateOpportunity('Renewal', item, 'Contacted', item.suggestedMessage)}>Mark contacted</button>
                  <button className="primary-button" type="button" onClick={() => updateOpportunity('Renewal', item, 'Renewed', item.suggestedMessage)}>Mark renewed</button>
                </footer>
              </article>
            ))}
          </ActionSection>
        )}

        {(activeTab === 'Today' || activeTab === 'VIP Rescue') && (
          <ActionSection title="VIP Rescue Center" count={openVip.length}>
            {todayVip.map((item) => {
              const message = `Hi ${item.customerName}, we would love to welcome you back to Sabai Haus. ${item.recoveryOffer}`
              return (
                <article className="front-desk-action-card vip-rescue-card" key={item.id}>
                  <header>
                    <div className="action-customer">
                      <span><Crown size={18} /></span>
                      <div><strong>{item.customerName}</strong><small>{item.segment} · {item.daysInactive} days inactive</small></div>
                    </div>
                    <Priority score={item.riskScore} />
                  </header>
                  <div className="action-detail-grid">
                    <div><small>Lifetime value</small><strong>{money(item.lifetimeValue)}</strong></div>
                    <div><small>Future booking</small><strong>{item.hasFutureBooking ? 'Booked' : 'None'}</strong></div>
                    <div><small>Recommended follow-up</small><strong>{item.recommendedTherapist}</strong></div>
                    <div><small>Risk score</small><strong>{Math.round(item.riskScore)} / 100</strong></div>
                  </div>
                  <p className="suggested-message"><b>Recovery offer:</b> {item.recoveryOffer}</p>
                  <footer>
                    <a className="whatsapp-button" href={whatsappUrl(item.phone, message)} target="_blank" rel="noreferrer">
                      <MessageCircleMore size={15} /> WhatsApp
                    </a>
                    <button className="secondary-button" type="button" onClick={() => updateOpportunity('VIP Rescue', item, 'Contacted', message)}>Mark contacted</button>
                    <button className="primary-button" type="button" onClick={() => updateOpportunity('VIP Rescue', item, 'Completed', message)}>Complete rescue</button>
                  </footer>
                </article>
              )
            })}
          </ActionSection>
        )}

        {activeTab === 'Messages' && (
          <ActionSection title="Message queue preview" count={snapshot.messages.length}>
            {snapshot.messages.map((item) => (
              <article className="message-action-card" key={item.id}>
                <div className="message-action-main">
                  <span className="message-channel"><MessageCircleMore size={17} /></span>
                  <div><strong>{item.customerName}</strong><small>{item.purpose} · {item.channel}</small><p>{item.message}</p></div>
                </div>
                <div className="message-action-meta">
                  <small>{item.scheduledAt}</small>
                  <span className={`domain-badge ${item.status === 'Failed' ? 'danger' : item.status === 'Sent' ? 'success' : 'gold'}`}>{item.status}</span>
                </div>
                <footer>
                  <button className="secondary-button" type="button" onClick={() => setPreview(item)}><Eye size={14} /> Preview</button>
                  <button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(item.message)}><Copy size={14} /> Copy</button>
                  <button className="primary-button" type="button" onClick={() => updateMessage(item, 'Sent')}><Check size={14} /> Sent</button>
                  <button className="secondary-button" type="button" onClick={() => updateMessage(item, 'Failed')}><CircleAlert size={14} /> Failed</button>
                </footer>
              </article>
            ))}
          </ActionSection>
        )}

        {activeTab === 'Completed' && (
          <section className="completed-action-list">
            <div className="action-section-heading"><div><span className="panel-kicker">Execution history</span><h3>Completed actions</h3></div><strong>{completedCount}</strong></div>
            {[...snapshot.rebooking, ...snapshot.renewals, ...snapshot.vipRescue]
              .filter((item) => item.status === 'Completed')
              .map((item) => (
                <article key={item.id}>
                  <span><Check size={16} /></span>
                  <div><strong>{item.customerName}</strong><small>Front desk action completed</small></div>
                  <span className="domain-badge success">Completed</span>
                </article>
              ))}
            {completedCount === 0 && <div className="action-empty">Completed actions will appear here as the team works through today's list.</div>}
          </section>
        )}
      </section>

      {preview && (
        <div className="message-preview-backdrop" role="presentation" onClick={() => setPreview(null)}>
          <section className="message-preview-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header><div><span className="panel-kicker">Message preview</span><h3>{preview.purpose}</h3></div><button type="button" onClick={() => setPreview(null)} aria-label="Close"><X size={18} /></button></header>
            <div className="message-preview-bubble">{preview.message}</div>
            <small>To {preview.customerName} · {preview.recipient}</small>
            <footer>
              <button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(preview.message)}><Copy size={14} /> Copy message</button>
              <button className="primary-button" type="button" onClick={() => updateMessage(preview, 'Sent')}><Send size={14} /> Mark sent</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

function ActionSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section className="action-section">
      <div className="action-section-heading">
        <div><span className="panel-kicker">Prioritized actions</span><h3>{title}</h3></div>
        <strong>{count}</strong>
      </div>
      <div className="front-desk-card-grid">{children}</div>
      {count === 0 && <div className="action-empty">Nothing needs attention in this category.</div>}
    </section>
  )
}
