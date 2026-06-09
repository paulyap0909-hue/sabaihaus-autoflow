import {
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleSlash2,
  Clock3,
  DoorOpen,
  Play,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  UserCheck,
  UserRoundX,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Drawer } from '../../components/Drawer'
import { FilterControl } from '../../components/FilterControl'
import { FormField } from '../../components/FormField'
import { OperationalKpi } from '../../components/OperationalKpi'
import { appointments as initialAppointments } from '../../services/mockOperations'
import type { Appointment, AppointmentStatus } from '../../types/appointments'

const statusClass: Record<AppointmentStatus, string> = {
  Booked: 'neutral',
  Confirmed: 'teal',
  'Checked In': 'gold',
  'In Treatment': 'purple',
  Completed: 'success',
  Cancelled: 'danger',
  'No Show': 'danger',
}

function nextAction(status: AppointmentStatus) {
  if (status === 'Booked') return { label: 'Confirm', status: 'Confirmed' as const, icon: Check }
  if (status === 'Confirmed') return { label: 'Check In', status: 'Checked In' as const, icon: UserCheck }
  if (status === 'Checked In') return { label: 'Start Treatment', status: 'In Treatment' as const, icon: Play }
  if (status === 'In Treatment') return { label: 'Complete', status: 'Completed' as const, icon: CheckCircle2 }
  return null
}

interface AppointmentsModuleProps {
  isCreateOpen: boolean
  onCreateOpen: () => void
  onCreateClose: () => void
}

export function AppointmentsModule({
  isCreateOpen,
  onCreateOpen,
  onCreateClose,
}: AppointmentsModuleProps) {
  const [records, setRecords] = useState(initialAppointments)
  const [search, setSearch] = useState('')
  const [therapist, setTherapist] = useState('All')
  const [status, setStatus] = useState('All')
  const [service, setService] = useState('All')
  const [date, setDate] = useState('2026-06-10')

  const filtered = useMemo(
    () =>
      records.filter((appointment) => {
        const query = search.toLowerCase()
        return (
          (!query ||
            appointment.customer.toLowerCase().includes(query) ||
            appointment.phone.toLowerCase().includes(query)) &&
          (therapist === 'All' || appointment.therapist === therapist) &&
          (status === 'All' || appointment.status === status) &&
          (service === 'All' || appointment.service === service) &&
          (!date || appointment.date === date)
        )
      }),
    [date, records, search, service, status, therapist],
  )

  const count = (target: AppointmentStatus) =>
    records.filter((appointment) => appointment.status === target).length

  const updateStatus = (id: string, nextStatus: AppointmentStatus) => {
    setRecords((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status: nextStatus } : appointment,
      ),
    )
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const newAppointment: Appointment = {
      id: `APT-${1053 + records.length}`,
      customer: String(data.get('customer')),
      phone: String(data.get('phone')),
      service: String(data.get('service')),
      therapist: String(data.get('therapist')),
      room: String(data.get('room')),
      date: String(data.get('date')),
      time: String(data.get('time')),
      duration: Number(data.get('duration')),
      price: Number(data.get('price')),
      status: 'Booked',
      source: 'Walk-in',
      notes: String(data.get('notes')),
    }
    setRecords((current) => [newAppointment, ...current])
    onCreateClose()
  }

  return (
    <>
      <section className="operational-kpi-grid five">
        <OperationalKpi label="Today’s Appointments" value={records.length} detail="Across 4 therapists" icon={CalendarDays} />
        <OperationalKpi label="Confirmed" value={count('Confirmed')} detail="Ready to arrive" icon={CalendarCheck2} />
        <OperationalKpi label="Checked In" value={count('Checked In')} detail="Waiting or preparing" icon={UserCheck} tone="gold" />
        <OperationalKpi label="In Treatment" value={count('In Treatment')} detail="Live sessions" icon={Play} />
        <OperationalKpi label="No Show" value={count('No Show')} detail="Follow-up required" icon={UserRoundX} tone="neutral" />
      </section>

      <section className="filter-panel">
        <div className="search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer name or phone"
            aria-label="Search appointments"
          />
        </div>
        <FilterControl label="Date">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </FilterControl>
        <FilterControl label="Therapist">
          <select value={therapist} onChange={(event) => setTherapist(event.target.value)}>
            <option>All</option>
            <option>Nok S.</option>
            <option>Aom M.</option>
            <option>Mei L.</option>
            <option>Pim J.</option>
          </select>
        </FilterControl>
        <FilterControl label="Status">
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            {Object.keys(statusClass).map((item) => <option key={item}>{item}</option>)}
          </select>
        </FilterControl>
        <FilterControl label="Service">
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option>All</option>
            {[...new Set(records.map((item) => item.service))].map((item) => <option key={item}>{item}</option>)}
          </select>
        </FilterControl>
      </section>

      <section className="records-panel">
        <div className="records-header">
          <div>
            <span className="panel-kicker">Treatment flow</span>
            <h2 className="panel-title">{filtered.length} appointments</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onCreateOpen}>
            <Plus size={15} /> New Appointment
          </button>
        </div>

        <div className="appointment-list">
          {filtered.map((appointment) => {
            const action = nextAction(appointment.status)
            const ActionIcon = action?.icon
            return (
              <article className="appointment-record" key={appointment.id}>
                <div className="appointment-time-block">
                  <strong>{appointment.time}</strong>
                  <span>{appointment.duration} min</span>
                  <small>{appointment.date}</small>
                </div>
                <div className="appointment-person">
                  <span className="record-avatar">{appointment.customer.split(' ').map((part) => part[0]).join('')}</span>
                  <div>
                    <strong>{appointment.customer}</strong>
                    <span>{appointment.phone}</span>
                    <small>{appointment.source}</small>
                  </div>
                </div>
                <div className="appointment-service">
                  <strong>{appointment.service}</strong>
                  <span>{appointment.therapist}</span>
                  <small><DoorOpen size={12} /> {appointment.room}</small>
                </div>
                <div className="appointment-value">
                  <span className={`domain-badge ${statusClass[appointment.status]}`}>{appointment.status}</span>
                  <strong>RM {appointment.price}</strong>
                </div>
                <div className="record-actions">
                  {action && ActionIcon && (
                    <button
                      className="action-button primary-action"
                      type="button"
                      onClick={() => updateStatus(appointment.id, action.status)}
                    >
                      <ActionIcon size={14} /> {action.label}
                    </button>
                  )}
                  {appointment.status === 'Completed' ? (
                    <button className="action-button" type="button">
                      <RotateCcw size={14} /> Rebook
                    </button>
                  ) : (
                    !['Cancelled', 'No Show'].includes(appointment.status) && (
                      <button
                        className="action-button danger-action"
                        type="button"
                        onClick={() => updateStatus(appointment.id, 'Cancelled')}
                      >
                        <CircleSlash2 size={14} /> Cancel
                      </button>
                    )
                  )}
                </div>
                {appointment.status === 'Completed' && (
                  <div className="completion-impact">
                    <span><ReceiptText size={13} /> Revenue</span>
                    <span><WalletCards size={13} /> Package redemption</span>
                    <span><CheckCircle2 size={13} /> Commission entry</span>
                    <span><Clock3 size={13} /> Follow-up task</span>
                    <span><UserCheck size={13} /> Visit history</span>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <Drawer
        open={isCreateOpen}
        onClose={onCreateClose}
        title="New Appointment"
        eyebrow="Front desk booking"
        footer={
          <>
            <button className="secondary-button" type="button" onClick={onCreateClose}>Cancel</button>
            <button className="primary-button" type="submit" form="appointment-form">Create appointment</button>
          </>
        }
      >
        <form className="drawer-form" id="appointment-form" onSubmit={handleCreate}>
          <FormField label="Customer"><input name="customer" required placeholder="Customer name" /></FormField>
          <FormField label="Phone"><input name="phone" required placeholder="+60..." /></FormField>
          <FormField label="Service">
            <select name="service" defaultValue="Aromatherapy Massage">
              <option>Aromatherapy Massage</option><option>Deep Tissue Massage</option><option>Signature Head Spa</option><option>Thai Wellness Ritual</option>
            </select>
          </FormField>
          <FormField label="Therapist">
            <select name="therapist"><option>Nok S.</option><option>Aom M.</option><option>Mei L.</option><option>Pim J.</option></select>
          </FormField>
          <FormField label="Room"><select name="room"><option>Lotus 1</option><option>Lotus 2</option><option>Siam 1</option><option>Siam 2</option></select></FormField>
          <FormField label="Date"><input name="date" type="date" defaultValue="2026-06-10" required /></FormField>
          <FormField label="Time"><input name="time" type="time" defaultValue="16:00" required /></FormField>
          <FormField label="Duration"><select name="duration"><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></FormField>
          <FormField label="Price"><input name="price" type="number" defaultValue="220" min="0" required /></FormField>
          <FormField label="Notes" full><textarea name="notes" rows={4} placeholder="Preferences, preparation notes, or booking context" /></FormField>
        </form>
      </Drawer>
    </>
  )
}
