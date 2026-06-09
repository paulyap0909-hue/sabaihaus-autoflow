import {
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Drawer } from '../../components/Drawer'
import { OperationalKpi } from '../../components/OperationalKpi'
import { therapists } from '../../services/mockPhase3'
import type { Therapist, TherapistAvailability } from '../../types/therapists'

const availabilityClass: Record<TherapistAvailability, string> = {
  Available: 'success',
  'In Treatment': 'purple',
  Break: 'gold',
  'Off Duty': 'neutral',
}

export function TherapistsModule() {
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('All')
  const [selected, setSelected] = useState<Therapist | null>(null)

  const filtered = useMemo(
    () =>
      therapists.filter(
        (therapist) =>
          (!search ||
            therapist.name.toLowerCase().includes(search.toLowerCase()) ||
            therapist.specialties.some((specialty) => specialty.toLowerCase().includes(search.toLowerCase()))) &&
          (availability === 'All' || therapist.availability === availability),
      ),
    [availability, search],
  )

  const totalRevenue = therapists.reduce((sum, therapist) => sum + therapist.revenue, 0)
  const averageRebooking = Math.round(therapists.reduce((sum, therapist) => sum + therapist.rebookingRate, 0) / therapists.length)
  const averageRating = therapists.reduce((sum, therapist) => sum + therapist.rating, 0) / therapists.length

  return (
    <>
      <section className="operational-kpi-grid four">
        <OperationalKpi label="Active Therapists" value={therapists.length} detail="2 available now" icon={UsersRound} />
        <OperationalKpi label="Team Revenue" value={`RM ${totalRevenue.toLocaleString()}`} detail="Current month" icon={CircleDollarSign} />
        <OperationalKpi label="Average Rebooking" value={`${averageRebooking}%`} detail="+3 points this month" icon={CalendarCheck2} />
        <OperationalKpi label="Customer Rating" value={averageRating.toFixed(1)} detail="Team average" icon={Star} tone="gold" />
      </section>

      <section className="therapist-performance-strip">
        <div><span className="panel-kicker">Performance dashboard</span><h2 className="panel-title">Team health at a glance</h2></div>
        <div className="team-stat"><TrendingUp size={16} /><span>Top revenue</span><strong>Nok S. · RM 31,320</strong></div>
        <div className="team-stat"><UserCheck size={16} /><span>Best rebooking</span><strong>Nok S. · 78%</strong></div>
        <div className="team-stat"><Sparkles size={16} /><span>Best upsell</span><strong>Mei L. · 41%</strong></div>
      </section>

      <section className="filter-panel compact-filters">
        <div className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search therapist or specialty" /></div>
        <label className="filter-control"><span>Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All</option><option>Available</option><option>In Treatment</option><option>Break</option><option>Off Duty</option></select></label>
      </section>

      <section className="therapist-directory">
        {filtered.map((therapist) => (
          <button className="therapist-card" type="button" key={therapist.id} onClick={() => setSelected(therapist)}>
            <div className="therapist-card-head">
              <span className="therapist-large-avatar">{therapist.initials}</span>
              <div><strong>{therapist.name}</strong><span>{therapist.specialties.join(' · ')}</span></div>
              <span className={`domain-badge ${availabilityClass[therapist.availability]}`}>{therapist.availability}</span>
            </div>
            <div className="next-availability"><Clock3 size={14} /><span>Next available</span><strong>{therapist.nextAvailable}</strong></div>
            <div className="therapist-metrics">
              <div><span>Revenue</span><strong>RM {therapist.revenue.toLocaleString()}</strong></div>
              <div><span>Rebooking</span><strong>{therapist.rebookingRate}%</strong></div>
              <div><span>Upsell</span><strong>{therapist.upsellRate}%</strong></div>
              <div><span>Rating</span><strong>{therapist.rating} ★</strong></div>
            </div>
            <div className="target-progress">
              <div><span>Monthly target</span><strong>{Math.round((therapist.revenue / therapist.monthlyTarget) * 100)}%</strong></div>
              <div className="package-progress"><span style={{ width: `${Math.min((therapist.revenue / therapist.monthlyTarget) * 100, 100)}%` }} /></div>
            </div>
          </button>
        ))}
      </section>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        eyebrow="Therapist performance"
        wide
        footer={<button className="primary-button" type="button">View full schedule</button>}
      >
        {selected && (
          <div className="therapist-drawer">
            <section className="therapist-detail-hero">
              <span className="therapist-large-avatar">{selected.initials}</span>
              <div><strong>{selected.specialties.join(' · ')}</strong><span>{selected.sessions} completed sessions this month</span></div>
              <span className={`domain-badge ${availabilityClass[selected.availability]}`}>{selected.availability}</span>
            </section>
            <div className="therapist-detail-grid">
              <article><CircleDollarSign size={18} /><span>Revenue</span><strong>RM {selected.revenue.toLocaleString()}</strong></article>
              <article><CalendarCheck2 size={18} /><span>Rebooking rate</span><strong>{selected.rebookingRate}%</strong></article>
              <article><TrendingUp size={18} /><span>Upsell rate</span><strong>{selected.upsellRate}%</strong></article>
              <article><Star size={18} /><span>Customer rating</span><strong>{selected.rating} / 5</strong></article>
            </div>
            <section className="therapist-commission-card">
              <div><span>Commission summary</span><strong>RM {selected.commission.toLocaleString()}</strong><small>Current month · pending payroll workflow</small></div>
              <CircleDollarSign size={25} />
            </section>
            <section className="profile-section">
              <h3>Revenue target</h3>
              <div className="target-detail"><span>RM {selected.revenue.toLocaleString()} earned</span><span>RM {selected.monthlyTarget.toLocaleString()} target</span></div>
              <div className="package-progress large"><span style={{ width: `${Math.min((selected.revenue / selected.monthlyTarget) * 100, 100)}%` }} /></div>
            </section>
            <section className="profile-section">
              <h3>Availability today</h3>
              <div className="availability-callout"><Clock3 size={17} /><div><strong>{selected.availability}</strong><span>Next available: {selected.nextAvailable}</span></div></div>
            </section>
          </div>
        )}
      </Drawer>
    </>
  )
}
