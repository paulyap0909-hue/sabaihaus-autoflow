import {
  CalendarCheck2,
  CalendarDays,
  CalendarSync,
  Check,
  CheckCircle2,
  CircleSlash2,
  Clock3,
  Cloud,
  Crown,
  DoorOpen,
  MessageCircleMore,
  PackageOpen,
  Play,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Drawer } from '../../components/Drawer'
import { FilterControl } from '../../components/FilterControl'
import { FormField } from '../../components/FormField'
import { OperationalKpi } from '../../components/OperationalKpi'
import {
  demoGoogleCalendarAdapter,
  type TherapistCalendarSync,
} from '../../services/calendar/googleCalendarAdapter'
import {
  appointments as initialAppointments,
  customers,
} from '../../services/mockOperations'
import type { Appointment, AppointmentStatus } from '../../types/appointments'
import { AppointmentScheduleBoard } from './AppointmentScheduleBoard'
import {
  appointmentViews,
  buildWhatsAppUrl,
  findSchedulingConflict,
  getCustomerInsight,
  treatmentRooms,
  type AppointmentView,
} from './appointmentIntelligence'
import {
  appointmentStatuses,
  assertAppointmentTransition,
  completeAppointment,
} from './eventEngine'
import { executeDemoAppointmentCompletion } from './eventEngine/demoAppointmentEventStore'
import { RealtimeAppointmentQueue } from './RealtimeAppointmentQueue'
import { RoomAvailabilityView } from './RoomAvailabilityView'
import { TherapistUtilizationDashboard } from './TherapistUtilizationDashboard'

const statusClass: Record<AppointmentStatus, string> = {
  Pending: 'neutral',
  Confirmed: 'teal',
  'Checked In': 'gold',
  'In Progress': 'purple',
  Completed: 'success',
  Cancelled: 'danger',
  'No Show': 'danger',
}

function nextAction(status: AppointmentStatus) {
  if (status === 'Pending') {
    return { label: 'Confirm', status: 'Confirmed' as const, icon: Check }
  }
  if (status === 'Confirmed') {
    return { label: 'Check In', status: 'Checked In' as const, icon: UserCheck }
  }
  if (status === 'Checked In') {
    return { label: 'Start Treatment', status: 'In Progress' as const, icon: Play }
  }
  if (status === 'In Progress') {
    return { label: 'Complete', status: 'Completed' as const, icon: CheckCircle2 }
  }
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
  const [activeView, setActiveView] = useState<AppointmentView>('Schedule')
  const [search, setSearch] = useState('')
  const [therapist, setTherapist] = useState('All')
  const [status, setStatus] = useState('All')
  const [service, setService] = useState('All')
  const [date, setDate] = useState('2026-06-10')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [eventError, setEventError] = useState('')
  const [calendarMessage, setCalendarMessage] = useState(
    'Demo calendars ready for two-way synchronization.',
  )
  const [calendarSyncs, setCalendarSyncs] = useState<TherapistCalendarSync[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

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

  const updateStatus = async (
    appointment: Appointment,
    nextStatus: AppointmentStatus,
  ) => {
    try {
      assertAppointmentTransition(appointment.status, nextStatus)
      setEventError('')
      setProcessingId(appointment.id)

      if (nextStatus === 'Completed') {
        const customer = customers.find(
          (item) => item.name === appointment.customer,
        )
        const completedAt = new Date(
          `${appointment.date}T${appointment.time}:00+08:00`,
        ).toISOString()

        await completeAppointment(
          {
            organizationId: 'demo-sabai-haus',
            branchId: 'demo-mont-kiara',
            appointmentId: appointment.id,
            customerId: customer?.id ?? `CUS-${appointment.id}`,
            therapistId: appointment.therapist
              .toLowerCase()
              .replaceAll(/[^a-z0-9]+/g, '-'),
            serviceId: appointment.service
              .toLowerCase()
              .replaceAll(/[^a-z0-9]+/g, '-'),
            customerPackageId:
              customer && customer.packageBalance > 0
                ? `PKG-${customer.id}`
                : undefined,
            completedAt,
            priceMinor: appointment.price * 100,
            actorId: 'demo-admin',
            idempotencyKey: `${appointment.id}:completed`,
          },
          { executeCompletion: executeDemoAppointmentCompletion },
        )
      }

      const updatedAppointment = { ...appointment, status: nextStatus }

      if (nextStatus === 'Cancelled') {
        await demoGoogleCalendarAdapter.deleteEvent(updatedAppointment)
        setCalendarMessage(
          `${appointment.customer}'s event was removed from Google Calendar.`,
        )
      } else {
        const syncResult =
          await demoGoogleCalendarAdapter.updateEvent(updatedAppointment)
        updatedAppointment.googleEventId = syncResult.eventId
        setCalendarMessage(
          `${appointment.customer}'s status was synced to Google Calendar.`,
        )
      }

      setRecords((current) =>
        current.map((record) =>
          record.id === appointment.id ? updatedAppointment : record,
        ),
      )
    } catch (error) {
      setEventError(
        error instanceof Error
          ? error.message
          : 'Appointment status could not be updated.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  const rescheduleAppointment = async (
    appointmentId: string,
    nextTherapist: string,
    nextTime: string,
  ) => {
    const appointment = records.find((item) => item.id === appointmentId)
    if (!appointment) return

    const candidate = {
      ...appointment,
      therapist: nextTherapist,
      time: nextTime,
    }
    const conflict = findSchedulingConflict(candidate, records)

    if (conflict) {
      setEventError(conflict)
      return
    }

    try {
      setEventError('')
      setProcessingId(appointmentId)
      const syncResult = await demoGoogleCalendarAdapter.updateEvent(candidate)
      candidate.googleEventId = syncResult.eventId
      setRecords((current) =>
        current.map((item) => (item.id === appointmentId ? candidate : item)),
      )
      setCalendarMessage(
        `${candidate.customer} moved to ${nextTime} with ${nextTherapist}; Google Calendar updated.`,
      )
    } catch (error) {
      setEventError(
        error instanceof Error ? error.message : 'Rescheduling failed.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  const syncCalendars = async () => {
    try {
      setIsSyncing(true)
      setEventError('')
      const syncs =
        await demoGoogleCalendarAdapter.syncTherapistCalendars(records)
      setCalendarSyncs(syncs)
      setCalendarMessage(
        `${syncs.length} therapist calendars synchronized successfully.`,
      )
    } catch (error) {
      setEventError(
        error instanceof Error ? error.message : 'Calendar sync failed.',
      )
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
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
      status: 'Pending',
      source: 'Walk-in',
      notes: String(data.get('notes')),
    }
    const conflict = findSchedulingConflict(newAppointment, records)

    if (conflict) {
      setEventError(conflict)
      onCreateClose()
      return
    }

    try {
      const syncResult =
        await demoGoogleCalendarAdapter.createEvent(newAppointment)
      newAppointment.googleEventId = syncResult.eventId
      setRecords((current) => [newAppointment, ...current])
      setCalendarMessage(
        `${newAppointment.customer}'s booking was created in Google Calendar.`,
      )
      setEventError('')
      onCreateClose()
    } catch (error) {
      setEventError(
        error instanceof Error ? error.message : 'Appointment creation failed.',
      )
    }
  }

  return (
    <>
      <section className="appointment-command-center">
        <div className="calendar-sync-card">
          <div className="calendar-sync-icon">
            <CalendarSync size={22} />
          </div>
          <div className="calendar-sync-copy">
            <span className="panel-kicker">Google Calendar bridge</span>
            <h2>Two-way therapist calendar sync</h2>
            <p>{calendarMessage}</p>
            <div className="calendar-operation-tags">
              <span>Create event</span>
              <span>Update event</span>
              <span>Delete event</span>
            </div>
          </div>
          <div className="calendar-sync-action">
            <span><Cloud size={13} /> {calendarSyncs.length || 4} calendars connected</span>
            <button type="button" onClick={() => void syncCalendars()} disabled={isSyncing}>
              <RefreshCw className={isSyncing ? 'is-spinning' : ''} size={15} />
              {isSyncing ? 'Syncing...' : 'Sync calendars'}
            </button>
          </div>
        </div>

        <div className="appointment-view-tabs" role="tablist" aria-label="Appointment views">
          {appointmentViews.map((view) => (
            <button
              className={activeView === view ? 'is-active' : ''}
              type="button"
              role="tab"
              aria-selected={activeView === view}
              key={view}
              onClick={() => setActiveView(view)}
            >
              {view}
            </button>
          ))}
        </div>
      </section>

      <section className="operational-kpi-grid five">
        <OperationalKpi label="Today's Appointments" value={records.length} detail="Across 4 therapists" icon={CalendarDays} />
        <OperationalKpi label="Confirmed" value={count('Confirmed')} detail="Ready to arrive" icon={CalendarCheck2} />
        <OperationalKpi label="Checked In" value={count('Checked In')} detail="Waiting or preparing" icon={UserCheck} tone="gold" />
        <OperationalKpi label="In Progress" value={count('In Progress')} detail="Live sessions" icon={Play} />
        <OperationalKpi label="Rooms Available" value={treatmentRooms.length - new Set(records.filter((item) => item.status === 'In Progress').map((item) => item.room)).size} detail={`${treatmentRooms.length} treatment rooms`} icon={DoorOpen} tone="neutral" />
      </section>

      <section className="appointment-intelligence-filters">
        <div className="search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search guest name or phone"
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
            {appointmentStatuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FilterControl>
        <FilterControl label="Service">
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option>All</option>
            {[...new Set(records.map((item) => item.service))].map((item) => <option key={item}>{item}</option>)}
          </select>
        </FilterControl>
      </section>

      {eventError && <p className="event-engine-error" role="alert">{eventError}</p>}

      {activeView === 'Schedule' && (
        <>
          <AppointmentScheduleBoard
            appointments={filtered}
            date={date}
            onReschedule={(appointmentId, nextTherapist, nextTime) =>
              void rescheduleAppointment(appointmentId, nextTherapist, nextTime)
            }
          />
          <TherapistUtilizationDashboard appointments={filtered} />
        </>
      )}

      {activeView === 'Live Queue' && (
        <RealtimeAppointmentQueue
          appointments={filtered}
          processingId={processingId}
          onStatusChange={(appointment, nextStatus) =>
            void updateStatus(appointment, nextStatus)
          }
        />
      )}

      {activeView === 'Rooms' && (
        <RoomAvailabilityView appointments={records} date={date} />
      )}

      {activeView === 'Treatment Flow' && (
        <section className="records-panel">
          <div className="records-header">
            <div>
              <span className="panel-kicker">Smart treatment flow</span>
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
              const insight = getCustomerInsight(appointment.customer)

              return (
                <article className="appointment-record intelligence-record" key={appointment.id}>
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
                    <a
                      className="action-button whatsapp-action"
                      href={buildWhatsAppUrl(appointment, appointment.status === 'Completed' ? 'Aftercare' : 'Reminder')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircleMore size={14} />
                      WhatsApp
                    </a>
                    {action && ActionIcon && (
                      <button
                        className="action-button primary-action"
                        type="button"
                        disabled={processingId === appointment.id}
                        onClick={() => void updateStatus(appointment, action.status)}
                      >
                        <ActionIcon size={14} />
                        {processingId === appointment.id ? 'Completing...' : action.label}
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
                          onClick={() => void updateStatus(appointment, 'Cancelled')}
                        >
                          <CircleSlash2 size={14} /> Cancel
                        </button>
                      )
                    )}
                  </div>
                  <div className="appointment-intelligence-strip">
                    <span><Crown size={12} /> {insight.membershipTier}</span>
                    <span><PackageOpen size={12} /> {insight.packageBalance} package sessions</span>
                    <span><WalletCards size={12} /> RM {insight.lifetimeSpending.toLocaleString()} lifetime</span>
                    {appointment.googleEventId && <span><CalendarCheck2 size={12} /> Google synced</span>}
                  </div>
                  {appointment.status === 'Completed' && (
                    <div className="completion-impact">
                      <span><ReceiptText size={13} /> Revenue</span>
                      <span><WalletCards size={13} /> Package redemption</span>
                      <span><ReceiptText size={13} /> Inventory movement</span>
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
      )}

      <Drawer
        open={isCreateOpen}
        onClose={onCreateClose}
        title="New Appointment"
        eyebrow="Calendar-connected booking"
        footer={
          <>
            <button className="secondary-button" type="button" onClick={onCreateClose}>Cancel</button>
            <button className="primary-button" type="submit" form="appointment-form">Create & sync</button>
          </>
        }
      >
        <form className="drawer-form" id="appointment-form" onSubmit={(event) => void handleCreate(event)}>
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
          <FormField label="Room">
            <select name="room">
              {treatmentRooms.map((room) => <option key={room.id}>{room.name}</option>)}
            </select>
          </FormField>
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
