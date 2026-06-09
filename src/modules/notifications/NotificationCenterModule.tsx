import {
  BellRing,
  CalendarClock,
  CircleAlert,
  Clock3,
  Mail,
  MessageCircleMore,
  MessageSquareText,
  Plus,
  Send,
  Smartphone,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Drawer } from '../../components/Drawer'
import { FormField } from '../../components/FormField'
import { OperationalKpi } from '../../components/OperationalKpi'
import { notificationQueue, notificationTemplates as initialTemplates } from '../../services/mockPhase35'
import type { NotificationChannel, NotificationTemplate } from '../../types/notifications'

const channels: Array<'All' | NotificationChannel> = ['All', 'WhatsApp', 'SMS', 'Email', 'MeTIME Wellness']
const channelIcon = {
  WhatsApp: MessageCircleMore,
  SMS: Smartphone,
  Email: Mail,
  'MeTIME Wellness': BellRing,
}
const queueClass: Record<string, string> = {
  Scheduled: 'teal',
  Sent: 'success',
  Failed: 'danger',
  Paused: 'neutral',
}
const variables = ['{{customer_name}}', '{{service_name}}', '{{appointment_date}}', '{{appointment_time}}', '{{therapist_name}}', '{{package_balance}}', '{{membership_tier}}', '{{branch_name}}']

interface NotificationCenterModuleProps {
  drawerOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export function NotificationCenterModule({ drawerOpen, onOpen, onClose }: NotificationCenterModuleProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [channel, setChannel] = useState<'All' | NotificationChannel>('All')

  const filtered = useMemo(
    () => templates.filter((template) => channel === 'All' || template.channel === channel),
    [channel, templates],
  )

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const template: NotificationTemplate = {
      id: `NT-${String(templates.length + 1).padStart(2, '0')}`,
      name: String(data.get('name')),
      channel: String(data.get('channel')) as NotificationChannel,
      trigger: String(data.get('trigger')),
      status: 'Active',
      lastSent: 'Not sent yet',
      successRate: 0,
      preview: String(data.get('content')),
    }
    setTemplates((current) => [template, ...current])
    setChannel('All')
    onClose()
  }

  return (
    <>
      <section className="operational-kpi-grid five">
        <OperationalKpi label="Messages Sent Today" value="146" detail="Across all mock channels" icon={Send} />
        <OperationalKpi label="Upcoming Reminders" value="32" detail="Next 24 hours" icon={CalendarClock} />
        <OperationalKpi label="Failed Messages" value="3" detail="Needs contact review" icon={CircleAlert} tone="gold" />
        <OperationalKpi label="Follow-ups Due" value="8" detail="Aftercare and win-back" icon={Clock3} tone="gold" />
        <OperationalKpi label="Renewal Alerts" value="12" detail="Packages and memberships" icon={BellRing} />
      </section>

      <section className="records-panel notification-template-panel">
        <div className="channel-tabs" role="tablist" aria-label="Notification channels">
          {channels.map((item) => {
            const Icon = item === 'All' ? MessageSquareText : channelIcon[item]
            return <button className={channel === item ? 'is-active' : ''} type="button" key={item} onClick={() => setChannel(item)}><Icon size={15} /> {item}</button>
          })}
          <button className="secondary-button channel-create" type="button" onClick={onOpen}><Plus size={15} /> Create Template</button>
        </div>
        <div className="template-grid">
          {filtered.map((template) => {
            const Icon = channelIcon[template.channel]
            return (
              <article className="template-card" key={template.id}>
                <div className="template-card-head">
                  <span className="template-channel-icon"><Icon size={18} /></span>
                  <div><strong>{template.name}</strong><span>{template.channel}</span></div>
                  <span className={`domain-badge ${template.status === 'Active' ? 'success' : 'neutral'}`}>{template.status}</span>
                </div>
                <div className="template-trigger"><span>Trigger</span><strong>{template.trigger}</strong></div>
                <p>{template.preview}</p>
                <div className="template-card-footer">
                  <span>Last sent<br /><strong>{template.lastSent}</strong></span>
                  <span>Success rate<br /><strong>{template.successRate}%</strong></span>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="records-panel notification-queue-panel">
        <div className="records-header">
          <div><span className="panel-kicker">Automation-ready mock queue</span><h2 className="panel-title">Upcoming scheduled messages</h2></div>
          <span className="api-disabled-note">No external APIs connected</span>
        </div>
        <div className="notification-queue">
          {notificationQueue.map((item) => {
            const Icon = channelIcon[item.channel]
            return (
              <article className="queue-record" key={item.id}>
                <div className="queue-customer-column">
                  <span className="queue-channel-icon"><Icon size={16} /></span>
                  <div><strong>{item.customer}</strong><span>{item.channel}</span></div>
                </div>
                <div className="queue-type-column"><span className="record-label">Message type</span><strong>{item.messageType}</strong></div>
                <div className="queue-time-column"><span className="record-label">Scheduled time</span><strong>{item.scheduledTime}</strong></div>
                <div className="queue-status-column"><span className={`domain-badge ${queueClass[item.status]}`}>{item.status}</span></div>
              </article>
            )
          })}
        </div>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={onClose}
        title="Create Template"
        eyebrow="Customer communication"
        wide
        footer={<><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" form="notification-template-form">Create template</button></>}
      >
        <form className="drawer-form" id="notification-template-form" onSubmit={handleCreate}>
          <FormField label="Template name" full><input name="name" required placeholder="Template name" /></FormField>
          <FormField label="Channel"><select name="channel"><option>WhatsApp</option><option>SMS</option><option>Email</option><option>MeTIME Wellness</option></select></FormField>
          <FormField label="Trigger"><select name="trigger"><option>Booking created</option><option>24 hours before appointment</option><option>2 hours before appointment</option><option>Appointment completed</option><option>Birthday</option><option>Package has 2 sessions remaining</option><option>Membership renews in 7 days</option><option>No-show marked</option><option>Customer inactive for 45 days</option></select></FormField>
          <FormField label="Audience" full><input name="audience" required placeholder="e.g. All confirmed customers" /></FormField>
          <FormField label="Message content" full><textarea name="content" rows={7} required placeholder="Write the customer message using variables below" /></FormField>
          <div className="variable-library">
            <span>Available variables</span>
            <div>{variables.map((variable) => <code key={variable}>{variable}</code>)}</div>
          </div>
        </form>
      </Drawer>
    </>
  )
}
