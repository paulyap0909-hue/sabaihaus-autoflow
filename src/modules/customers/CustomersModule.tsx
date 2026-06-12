import {
  Crown,
  Gem,
  HeartHandshake,
  PackageCheck,
  Plus,
  Search,
  TrendingDown,
  UserPlus,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Drawer } from '../../components/Drawer'
import { FilterControl } from '../../components/FilterControl'
import { FormField } from '../../components/FormField'
import { OperationalKpi } from '../../components/OperationalKpi'
import { customers as initialCustomers } from '../../services/mockOperations'
import type { Customer, RetentionStatus } from '../../types/customers'
import { CustomerTimeline } from './CustomerTimeline'

const retentionClass: Record<RetentionStatus, string> = {
  Active: 'success',
  'Follow Up Soon': 'gold',
  'At Risk': 'danger',
  Lost: 'neutral',
  VIP: 'purple',
}

interface CustomersModuleProps {
  isCreateOpen: boolean
  onCreateOpen: () => void
  onCreateClose: () => void
}

export function CustomersModule({
  isCreateOpen,
  onCreateOpen,
  onCreateClose,
}: CustomersModuleProps) {
  const [records, setRecords] = useState(initialCustomers)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')
  const [retention, setRetention] = useState('All')
  const [membership, setMembership] = useState('All')
  const [lastVisit, setLastVisit] = useState('All')
  const [service, setService] = useState('All')

  const filtered = useMemo(
    () =>
      records.filter((customer) => {
        const query = search.toLowerCase()
        const daysSinceVisit = Math.floor(
          (new Date('2026-06-10').getTime() - new Date(customer.lastVisit).getTime()) / 86400000,
        )
        const visitMatch =
          lastVisit === 'All' ||
          (lastVisit === '30 days' && daysSinceVisit <= 30) ||
          (lastVisit === '60 days' && daysSinceVisit <= 60) ||
          (lastVisit === '90+ days' && daysSinceVisit >= 90)
        return (
          (!query ||
            customer.name.toLowerCase().includes(query) ||
            customer.phone.toLowerCase().includes(query)) &&
          (retention === 'All' || customer.retentionStatus === retention) &&
          (membership === 'All' || customer.membershipTier === membership) &&
          (service === 'All' || customer.preferredService === service) &&
          visitMatch
        )
      }),
    [lastVisit, membership, records, retention, search, service],
  )

  const count = (target: RetentionStatus) =>
    records.filter((customer) => customer.retentionStatus === target).length

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const customer: Customer = {
      id: `CUS-${2050 + records.length}`,
      name: String(data.get('name')),
      phone: String(data.get('phone')),
      email: String(data.get('email')),
      birthday: String(data.get('birthday')),
      source: String(data.get('source')),
      preferredService: String(data.get('preferredService')),
      lastVisit: 'New customer',
      lifetimeValue: 0,
      packageBalance: 0,
      membershipTier: 'None',
      retentionStatus: 'Active',
      nextAction: 'Book the first wellness consultation',
      wellnessSummary: String(data.get('notes')) || 'Wellness profile not completed yet.',
      followUpNotes: 'New customer. Confirm preferred contact method.',
      visits: [],
    }
    setRecords((current) => [customer, ...current])
    onCreateClose()
  }

  return (
    <>
      <section className="operational-kpi-grid five">
        <OperationalKpi label="Total Customers" value={records.length} detail="Across all segments" icon={UsersRound} />
        <OperationalKpi label="Active Customers" value={count('Active')} detail="Visited recently" icon={HeartHandshake} />
        <OperationalKpi label="At Risk Customers" value={count('At Risk')} detail="Recovery opportunity" icon={TrendingDown} tone="gold" />
        <OperationalKpi label="VIP Customers" value={count('VIP')} detail="High-value relationships" icon={Crown} tone="gold" />
        <OperationalKpi label="New This Month" value="18" detail="+12% from May" icon={UserPlus} />
      </section>

      <section className="filter-panel">
        <div className="search-field">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or phone" aria-label="Search customers" />
        </div>
        <FilterControl label="Retention">
          <select value={retention} onChange={(event) => setRetention(event.target.value)}>
            <option>All</option>{Object.keys(retentionClass).map((item) => <option key={item}>{item}</option>)}
          </select>
        </FilterControl>
        <FilterControl label="Membership">
          <select value={membership} onChange={(event) => setMembership(event.target.value)}>
            <option>All</option><option>None</option><option>Essential</option><option>Serenity</option><option>Signature</option>
          </select>
        </FilterControl>
        <FilterControl label="Last visit">
          <select value={lastVisit} onChange={(event) => setLastVisit(event.target.value)}>
            <option>All</option><option>30 days</option><option>60 days</option><option>90+ days</option>
          </select>
        </FilterControl>
        <FilterControl label="Preferred service">
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option>All</option>{[...new Set(records.map((item) => item.preferredService))].map((item) => <option key={item}>{item}</option>)}
          </select>
        </FilterControl>
      </section>

      <section className="records-panel">
        <div className="records-header">
          <div>
            <span className="panel-kicker">Relationship health</span>
            <h2 className="panel-title">{filtered.length} customer profiles</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onCreateOpen}><Plus size={15} /> New Customer</button>
        </div>
        <div className="customer-list">
          {filtered.map((customer) => (
            <button className="customer-record" type="button" key={customer.id} onClick={() => setSelectedCustomer(customer)}>
              <span className="record-avatar customer-avatar">{customer.name.split(' ').map((part) => part[0]).join('')}</span>
              <div className="customer-identity">
                <strong>{customer.name}</strong>
                <span>{customer.phone}</span>
                <small>Last visit: {customer.lastVisit}</small>
              </div>
              <div className="customer-care">
                <span>Preferred care</span>
                <strong>{customer.preferredService}</strong>
                <small>{customer.packageBalance} package sessions left</small>
              </div>
              <div className="customer-commercial">
                <span>Lifetime value</span>
                <strong>RM {customer.lifetimeValue.toLocaleString()}</strong>
                <small>{customer.membershipTier} membership</small>
              </div>
              <div className="customer-status">
                <span className={`domain-badge ${retentionClass[customer.retentionStatus]}`}>{customer.retentionStatus}</span>
                <small>{customer.nextAction}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <Drawer
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name ?? ''}
        eyebrow={selectedCustomer?.id}
        wide
        footer={<button className="primary-button" type="button">Create follow-up task</button>}
      >
        {selectedCustomer && (
          <div className="customer-profile">
            <section className="profile-hero">
              <span className="profile-avatar">{selectedCustomer.name.split(' ').map((part) => part[0]).join('')}</span>
              <div><strong>{selectedCustomer.phone}</strong><span>{selectedCustomer.email}</span><small>Birthday {selectedCustomer.birthday} · Source: {selectedCustomer.source}</small></div>
              <span className={`domain-badge ${retentionClass[selectedCustomer.retentionStatus]}`}>{selectedCustomer.retentionStatus}</span>
            </section>
            <section className="profile-answer">
              <span><HeartHandshake size={17} /> What care do they need?</span>
              <p>{selectedCustomer.wellnessSummary}</p>
            </section>
            <section className="profile-answer commercial-answer">
              <span><Gem size={17} /> Recommended next action</span>
              <p>{selectedCustomer.nextAction}</p>
            </section>
            <div className="profile-summary-grid">
              <article><WalletCards size={17} /><span>Lifetime value</span><strong>RM {selectedCustomer.lifetimeValue.toLocaleString()}</strong></article>
              <article><PackageCheck size={17} /><span>Package balance</span><strong>{selectedCustomer.packageBalance} sessions</strong></article>
              <article><Crown size={17} /><span>Membership</span><strong>{selectedCustomer.membershipTier}</strong></article>
            </div>
            <CustomerTimeline customerName={selectedCustomer.name} />
          </div>
        )}
      </Drawer>

      <Drawer
        open={isCreateOpen}
        onClose={onCreateClose}
        title="New Customer"
        eyebrow="Customer relationship"
        footer={<><button className="secondary-button" type="button" onClick={onCreateClose}>Cancel</button><button className="primary-button" type="submit" form="customer-form">Create customer</button></>}
      >
        <form className="drawer-form" id="customer-form" onSubmit={handleCreate}>
          <FormField label="Name"><input name="name" required placeholder="Full name" /></FormField>
          <FormField label="Phone"><input name="phone" required placeholder="+60..." /></FormField>
          <FormField label="Email"><input name="email" type="email" placeholder="name@example.com" /></FormField>
          <FormField label="Birthday"><input name="birthday" type="date" /></FormField>
          <FormField label="Source"><select name="source"><option>Walk-in</option><option>WhatsApp</option><option>Google</option><option>Instagram</option><option>Referral</option></select></FormField>
          <FormField label="Preferred service"><select name="preferredService"><option>Aromatherapy Massage</option><option>Deep Tissue Massage</option><option>Signature Head Spa</option><option>Thai Wellness Ritual</option></select></FormField>
          <FormField label="Notes" full><textarea name="notes" rows={5} placeholder="Preferences, goals, or important context" /></FormField>
        </form>
      </Drawer>
    </>
  )
}
