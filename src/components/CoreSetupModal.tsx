import { CheckCircle2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { FormField } from './FormField'
import {
  createMembershipPlan,
  type MembershipPlanTier,
} from '../services/repositories/membershipsRepository'
import { createPackageDefinition } from '../services/repositories/packagesRepository'
import {
  createTherapist,
  type TherapistStatus,
} from '../services/repositories/therapistsRepository'

export type CoreSetupKind = 'Membership' | 'Package' | 'Therapist'

interface CoreSetupModalProps {
  kind: CoreSetupKind
  open: boolean
  onClose: () => void
  onCreated: (message: string) => void
}

const splitValues = (value: string) =>
  value.split(',').map((item) => item.trim()).filter(Boolean)

export function CoreSetupModal({
  kind,
  open,
  onClose,
  onCreated,
}: CoreSetupModalProps) {
  if (!open) return null

  return (
    <div className="core-modal-layer" role="presentation">
      <button className="core-modal-backdrop" type="button" onClick={onClose} aria-label="Close modal" />
      <section className="core-modal" role="dialog" aria-modal="true" aria-label={`Add ${kind}`}>
        <header>
          <div>
            <span>Core setup</span>
            <h2>Add {kind}</h2>
            <p>Test mode: this will create a live Supabase record.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        {kind === 'Membership' && <MembershipForm onClose={onClose} onCreated={onCreated} />}
        {kind === 'Package' && <PackageForm onClose={onClose} onCreated={onCreated} />}
        {kind === 'Therapist' && <TherapistForm onClose={onClose} onCreated={onCreated} />}
      </section>
    </div>
  )
}

interface FormCallbacks {
  onClose: () => void
  onCreated: (message: string) => void
}

function FormError({ message }: { message: string }) {
  return message ? <div className="core-form-error">{message}</div> : null
}

function FormActions({
  saving,
  onClose,
}: {
  saving: boolean
  onClose: () => void
}) {
  return (
    <footer className="core-form-actions">
      <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
      <button className="primary-button" type="submit" disabled={saving}>
        <CheckCircle2 size={15} /> {saving ? 'Saving...' : 'Save live record'}
      </button>
    </footer>
  )
}

function MembershipForm({ onClose, onCreated }: FormCallbacks) {
  const [name, setName] = useState('')
  const [tier, setTier] = useState<MembershipPlanTier>('Silver')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [benefits, setBenefits] = useState('')
  const [active, setActive] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsedPrice = Number(price)
    const parsedDuration = Number(duration)
    if (!name.trim() || !price || !duration || !benefits.trim()) {
      setError('Membership name, price, duration and benefits are required.')
      return
    }
    if (parsedPrice < 0) {
      setError('Price cannot be negative.')
      return
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration < 1) {
      setError('Duration must be at least 1 day.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createMembershipPlan({
        name,
        tier,
        price: parsedPrice,
        durationDays: parsedDuration,
        benefits: splitValues(benefits),
        active,
      })
      onCreated(`${name.trim()} membership was created successfully.`)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Membership could not be created.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="core-setup-form" onSubmit={submit}>
      <div className="drawer-form">
        <FormField label="Membership name" full><input value={name} onChange={(event) => setName(event.target.value)} /></FormField>
        <FormField label="Tier"><select value={tier} onChange={(event) => setTier(event.target.value as MembershipPlanTier)}><option>Silver</option><option>Gold</option><option>Platinum</option><option>Diamond</option></select></FormField>
        <FormField label="Status"><select value={active ? 'Active' : 'Inactive'} onChange={(event) => setActive(event.target.value === 'Active')}><option>Active</option><option>Inactive</option></select></FormField>
        <FormField label="Price RM"><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></FormField>
        <FormField label="Duration days"><input type="number" min="1" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} /><small className="schema-field-note">Duration is not stored in current schema yet.</small></FormField>
        <FormField label="Benefits (comma separated)" full><textarea rows={4} value={benefits} onChange={(event) => setBenefits(event.target.value)} /></FormField>
      </div>
      <FormError message={error} />
      <FormActions saving={saving} onClose={onClose} />
    </form>
  )
}

function PackageForm({ onClose, onCreated }: FormCallbacks) {
  const [name, setName] = useState('')
  const [service, setService] = useState('')
  const [sessions, setSessions] = useState('1')
  const [price, setPrice] = useState('')
  const [validity, setValidity] = useState('90')
  const [active, setActive] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsedSessions = Number(sessions)
    const parsedPrice = Number(price)
    const parsedValidity = Number(validity)
    if (!name.trim() || !service.trim() || !price || !validity) {
      setError('Package name, service, price and validity are required.')
      return
    }
    if (!Number.isInteger(parsedSessions) || parsedSessions < 1) {
      setError('Total sessions must be at least 1.')
      return
    }
    if (parsedPrice < 0) {
      setError('Price cannot be negative.')
      return
    }
    if (!Number.isInteger(parsedValidity) || parsedValidity < 1) {
      setError('Validity must be at least 1 day.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createPackageDefinition({
        name,
        service,
        totalSessions: parsedSessions,
        price: parsedPrice,
        validityDays: parsedValidity,
        active,
      })
      onCreated(`${name.trim()} package was created successfully.`)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Package could not be created.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="core-setup-form" onSubmit={submit}>
      <div className="drawer-form">
        <FormField label="Package name" full><input value={name} onChange={(event) => setName(event.target.value)} /></FormField>
        <FormField label="Service"><input value={service} onChange={(event) => setService(event.target.value)} /></FormField>
        <FormField label="Status"><select value={active ? 'Active' : 'Inactive'} onChange={(event) => setActive(event.target.value === 'Active')}><option>Active</option><option>Inactive</option></select></FormField>
        <FormField label="Total sessions"><input type="number" min="1" step="1" value={sessions} onChange={(event) => setSessions(event.target.value)} /></FormField>
        <FormField label="Price RM"><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></FormField>
        <FormField label="Validity days" full><input type="number" min="1" step="1" value={validity} onChange={(event) => setValidity(event.target.value)} /></FormField>
      </div>
      <FormError message={error} />
      <FormActions saving={saving} onClose={onClose} />
    </form>
  )
}

function TherapistForm({ onClose, onCreated }: FormCallbacks) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [specialties, setSpecialties] = useState('')
  const [rating, setRating] = useState('0')
  const [status, setStatus] = useState<TherapistStatus>('Active')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsedRating = Number(rating)
    if (!fullName.trim() || !phone.trim() || !email.trim() || !roleTitle.trim() || !specialties.trim()) {
      setError('Full name, phone, email, role title and specialties are required.')
      return
    }
    if (parsedRating < 0 || parsedRating > 5) {
      setError('Rating must be between 0 and 5.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createTherapist({
        fullName,
        phone,
        email,
        roleTitle,
        specialties: splitValues(specialties),
        rating: parsedRating,
        status,
      })
      onCreated(`${fullName.trim()} was added successfully.`)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Therapist could not be created.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="core-setup-form" onSubmit={submit}>
      <div className="drawer-form">
        <FormField label="Full name" full><input value={fullName} onChange={(event) => setFullName(event.target.value)} /></FormField>
        <FormField label="Phone"><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /><small className="schema-field-note">Phone is not stored in current schema yet.</small></FormField>
        <FormField label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /><small className="schema-field-note">Email is not stored in current schema yet.</small></FormField>
        <FormField label="Role title"><input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} /></FormField>
        <FormField label="Status"><select value={status} onChange={(event) => setStatus(event.target.value as TherapistStatus)}><option>Active</option><option>Inactive</option><option>On Leave</option></select></FormField>
        <FormField label="Specialties (comma separated)" full><textarea rows={3} value={specialties} onChange={(event) => setSpecialties(event.target.value)} /></FormField>
        <FormField label="Rating 0–5" full><input type="number" min="0" max="5" step="0.1" value={rating} onChange={(event) => setRating(event.target.value)} /></FormField>
      </div>
      <FormError message={error} />
      <FormActions saving={saving} onClose={onClose} />
    </form>
  )
}
