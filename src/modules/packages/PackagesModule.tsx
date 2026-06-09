import {
  CalendarClock,
  CircleDollarSign,
  History,
  PackageCheck,
  PackageOpen,
  Search,
  TicketCheck,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Drawer } from '../../components/Drawer'
import { OperationalKpi } from '../../components/OperationalKpi'
import { customerPackages, packageDefinitions } from '../../services/mockPhase3'
import type { CustomerPackage, PackageStatus } from '../../types/packages'

const statusClass: Record<PackageStatus, string> = {
  Active: 'success',
  'Low Balance': 'gold',
  'Expiring Soon': 'danger',
  Expired: 'neutral',
}

type PackageTab = 'Customer Packages' | 'Package Definitions'

export function PackagesModule() {
  const [activeTab, setActiveTab] = useState<PackageTab>('Customer Packages')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [selected, setSelected] = useState<CustomerPackage | null>(null)

  const filtered = useMemo(
    () =>
      customerPackages.filter(
        (item) =>
          (!search ||
            item.customer.toLowerCase().includes(search.toLowerCase()) ||
            item.packageName.toLowerCase().includes(search.toLowerCase())) &&
          (status === 'All' || item.status === status),
      ),
    [search, status],
  )

  return (
    <>
      <section className="operational-kpi-grid four">
        <OperationalKpi label="Active Customer Packages" value="93" detail="Across 4 package types" icon={PackageCheck} />
        <OperationalKpi label="Outstanding Sessions" value="286" detail="Future treatment liability" icon={TicketCheck} />
        <OperationalKpi label="Low Balance" value="14" detail="Renewal opportunity" icon={TriangleAlert} tone="gold" />
        <OperationalKpi label="Expiring Soon" value="11" detail="Within the next 30 days" icon={CalendarClock} tone="gold" />
      </section>

      <section className="records-panel">
        <div className="commission-tabs">
          <button className={activeTab === 'Customer Packages' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('Customer Packages')}>Customer Packages</button>
          <button className={activeTab === 'Package Definitions' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('Package Definitions')}>Package Definitions</button>
        </div>

        {activeTab === 'Customer Packages' && (
          <>
            <div className="embedded-filters">
              <div className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer or package" /></div>
              <label className="filter-control"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Active</option><option>Low Balance</option><option>Expiring Soon</option><option>Expired</option></select></label>
            </div>
            <div className="package-balance-grid">
              {filtered.map((item) => {
                const used = item.totalSessions - item.remainingSessions
                return (
                  <button className="package-balance-card" type="button" key={item.id} onClick={() => setSelected(item)}>
                    <div className="package-card-head">
                      <span className="package-symbol"><PackageOpen size={18} /></span>
                      <span className={`domain-badge ${statusClass[item.status]}`}>{item.status}</span>
                    </div>
                    <h3>{item.packageName}</h3>
                    <p>{item.customer}</p>
                    <div className="balance-number"><strong>{item.remainingSessions}</strong><span>of {item.totalSessions} sessions remaining</span></div>
                    <div className="package-progress"><span style={{ width: `${(used / item.totalSessions) * 100}%` }} /></div>
                    <div className="package-card-footer"><span>Expires {item.expires}</span><strong>RM {item.valueRemaining}</strong></div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'Package Definitions' && (
          <div className="definition-grid">
            {packageDefinitions.map((definition) => (
              <article className="definition-card" key={definition.id}>
                <div className="definition-top"><span>{definition.category}</span><PackageOpen size={18} /></div>
                <h3>{definition.name}</h3>
                <div className="definition-price">RM {definition.price.toLocaleString()}</div>
                <div className="definition-details">
                  <span><strong>{definition.sessions}</strong> sessions</span>
                  <span><strong>{definition.validityDays}</strong> days valid</span>
                  <span><strong>{definition.activeCustomers}</strong> customers</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.packageName ?? ''}
        eyebrow={selected?.customer}
        footer={<button className="primary-button" type="button">Redeem next session</button>}
      >
        {selected && (
          <div className="package-drawer">
            <section className="package-balance-hero">
              <div><span>Remaining balance</span><strong>{selected.remainingSessions}<small> / {selected.totalSessions} sessions</small></strong></div>
              <span className={`domain-badge ${statusClass[selected.status]}`}>{selected.status}</span>
            </section>
            <div className="profile-summary-grid">
              <article><CircleDollarSign size={17} /><span>Value remaining</span><strong>RM {selected.valueRemaining}</strong></article>
              <article><CalendarClock size={17} /><span>Expires</span><strong>{selected.expires}</strong></article>
              <article><PackageCheck size={17} /><span>Purchased</span><strong>{selected.purchased}</strong></article>
            </div>
            <section className="profile-section">
              <h3><History size={17} /> Redemption history</h3>
              {selected.redemptions.map((redemption) => (
                <div className="visit-row" key={redemption.appointmentId}>
                  <div><strong>{redemption.service}</strong><span>{redemption.date} · {redemption.therapist}</span></div>
                  <span className="domain-badge neutral">{redemption.appointmentId}</span>
                </div>
              ))}
            </section>
          </div>
        )}
      </Drawer>
    </>
  )
}
