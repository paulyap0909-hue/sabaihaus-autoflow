import {
  CalendarClock,
  CircleAlert,
  Clock3,
  Mail,
  MessageCircleMore,
  MessageSquareText,
  RefreshCw,
  Send,
  Smartphone,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { OperationalKpi } from '../../components/OperationalKpi'
import {
  communicationTemplates,
  messageQueue,
} from '../../services/mockCommunication'
import type {
  CommunicationChannel,
  MessageQueueStatus,
} from '../../types/communication'
import {
  generateRebookingOpportunities,
  generateRenewalOpportunities,
} from './communicationEngine'

type CommunicationTab = CommunicationChannel | 'History'

const tabs: CommunicationTab[] = ['WhatsApp', 'Email', 'SMS', 'History']
const icons = {
  WhatsApp: MessageCircleMore,
  Email: Mail,
  SMS: Smartphone,
  History: MessageSquareText,
}
const statusClass: Record<MessageQueueStatus, string> = {
  Scheduled: 'teal',
  Pending: 'gold',
  Sent: 'success',
  Failed: 'danger',
  Cancelled: 'neutral',
}

export function CommunicationCenterModule() {
  const [activeTab, setActiveTab] = useState<CommunicationTab>('WhatsApp')
  const rebooking = useMemo(() => generateRebookingOpportunities(), [])
  const renewals = useMemo(() => generateRenewalOpportunities(), [])
  const templates = communicationTemplates.filter(
    (template) => template.channel === activeTab,
  )
  const queue = messageQueue.filter((item) =>
    activeTab === 'History'
      ? ['Sent', 'Failed', 'Cancelled'].includes(item.status)
      : item.channel === activeTab,
  )

  return (
    <>
      <section className="operational-kpi-grid five">
        <OperationalKpi label="Scheduled" value={messageQueue.filter((item) => item.status === 'Scheduled').length} detail="Ready for provider dispatch" icon={CalendarClock} />
        <OperationalKpi label="Pending" value={messageQueue.filter((item) => item.status === 'Pending').length} detail="Awaiting processing" icon={Clock3} tone="gold" />
        <OperationalKpi label="Sent" value={messageQueue.filter((item) => item.status === 'Sent').length} detail="Delivered to provider" icon={Send} />
        <OperationalKpi label="Failed" value={messageQueue.filter((item) => item.status === 'Failed').length} detail="Needs contact review" icon={CircleAlert} tone="gold" />
        <OperationalKpi label="Renewal Pipeline" value={`RM ${renewals.reduce((sum, item) => sum + item.expectedRevenue, 0).toLocaleString()}`} detail={`${renewals.length} opportunities`} icon={WalletCards} />
      </section>

      <section className="records-panel communication-center-panel">
        <div className="communication-tabs" role="tablist" aria-label="Communication channels">
          {tabs.map((tab) => {
            const Icon = icons[tab]
            return (
              <button
                className={activeTab === tab ? 'is-active' : ''}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                key={tab}
              >
                <Icon size={15} /> {tab}
              </button>
            )
          })}
        </div>

        {activeTab !== 'History' && (
          <div className="communication-template-grid">
            {templates.map((template) => (
              <article key={template.id}>
                <header>
                  <span>{template.purpose}</span>
                  <span className="domain-badge success">Active</span>
                </header>
                <h3>{template.name}</h3>
                <small>{template.trigger}</small>
                <p>{template.content}</p>
                <footer>
                  <span>Variables supported</span>
                  <strong>{template.content.match(/{{[^}]+}}/g)?.length ?? 0}</strong>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="records-panel communication-queue-panel">
        <div className="records-header">
          <div>
            <span className="panel-kicker">Provider-ready message queue</span>
            <h2 className="panel-title">
              {activeTab === 'History' ? 'Communication History' : `${activeTab} Queue`}
            </h2>
          </div>
          <span className="api-disabled-note">Provider dispatch adapter pending</span>
        </div>
        <div className="communication-queue">
          {queue.map((item) => {
            const Icon = icons[item.channel]
            return (
              <article key={item.id}>
                <div><span className="queue-channel-icon"><Icon size={16} /></span><div><strong>{item.customer}</strong><span>{item.recipient}</span></div></div>
                <div><span>Message type</span><strong>{item.messageType}</strong></div>
                <div><span>Scheduled</span><strong>{item.scheduledAt}</strong></div>
                <div><span className={`domain-badge ${statusClass[item.status]}`}>{item.status}</span></div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="engagement-opportunity-grid">
        <article className="records-panel">
          <div className="records-header">
            <div><span className="panel-kicker">Rebooking engine</span><h2 className="panel-title">No Future Booking</h2></div>
            <RefreshCw size={17} />
          </div>
          <div className="engagement-opportunity-list">
            {rebooking.map((item) => (
              <div key={item.id}>
                <span className="opportunity-score">{item.priorityScore}</span>
                <div><strong>{item.customer}</strong><span>{item.service} · {item.therapist}</span></div>
                <div><span>Suggested date</span><strong>{item.suggestedDate}</strong></div>
              </div>
            ))}
          </div>
        </article>
        <article className="records-panel">
          <div className="records-header">
            <div><span className="panel-kicker">Renewal engine</span><h2 className="panel-title">Revenue Opportunities</h2></div>
            <WalletCards size={17} />
          </div>
          <div className="engagement-opportunity-list">
            {renewals.slice(0, 6).map((item) => (
              <div key={item.id}>
                <span className="opportunity-score">{item.priorityScore}</span>
                <div><strong>{item.customer}</strong><span>{item.itemName} · {item.type}</span></div>
                <div><span>Expected revenue</span><strong>RM {item.expectedRevenue.toLocaleString()}</strong></div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}
