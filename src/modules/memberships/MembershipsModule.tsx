import {
  CalendarClock,
  Crown,
  Gem,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { OperationalKpi } from '../../components/OperationalKpi'
import { memberships, membershipTiers } from '../../services/mockPhase3'

const statusClass: Record<string, string> = {
  Active: 'success',
  'Renewal Due': 'gold',
  Paused: 'neutral',
  Expired: 'danger',
}

export function MembershipsModule() {
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('All')
  const [status, setStatus] = useState('All')

  const filtered = useMemo(
    () =>
      memberships.filter(
        (member) =>
          (!search || member.customer.toLowerCase().includes(search.toLowerCase())) &&
          (tier === 'All' || member.tier === tier) &&
          (status === 'All' || member.status === status),
      ),
    [search, status, tier],
  )

  return (
    <>
      <section className="operational-kpi-grid four">
        <OperationalKpi label="Active Members" value="186" detail="+14 this quarter" icon={UsersRound} />
        <OperationalKpi label="Monthly Member Value" value="RM 41,940" detail="Recurring relationship value" icon={Gem} />
        <OperationalKpi label="Renewals Due" value="12" detail="Within the next 14 days" icon={RefreshCw} tone="gold" />
        <OperationalKpi label="Member Visit Rate" value="1.8x" detail="Average visits per month" icon={CalendarClock} />
      </section>

      <section className="tier-dashboard">
        {membershipTiers.map((item) => (
          <article className={`tier-card ${item.color}`} key={item.tier}>
            <div className="tier-card-top">
              <span className="tier-medallion">{item.tier === 'Diamond' ? <Gem size={19} /> : item.tier === 'Platinum' ? <Crown size={19} /> : <ShieldCheck size={19} />}</span>
              <span>{item.members} members</span>
            </div>
            <h3>{item.tier}</h3>
            <p><strong>RM {item.monthlyPrice}</strong> / month</p>
            <ul>{item.benefits.map((benefit) => <li key={benefit}><Sparkles size={12} /> {benefit}</li>)}</ul>
          </article>
        ))}
      </section>

      <section className="records-panel">
        <div className="records-header">
          <div><span className="panel-kicker">Renewal tracking</span><h2 className="panel-title">Membership list</h2></div>
          <span className="records-count">{filtered.length} visible members</span>
        </div>
        <div className="embedded-filters">
          <div className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member" /></div>
          <label className="filter-control"><span>Tier</span><select value={tier} onChange={(event) => setTier(event.target.value)}><option>All</option><option>Silver</option><option>Gold</option><option>Platinum</option><option>Diamond</option></select></label>
          <label className="filter-control"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Active</option><option>Renewal Due</option><option>Paused</option><option>Expired</option></select></label>
        </div>
        <div className="membership-list">
          {filtered.map((member) => (
            <article className="membership-record" key={member.id}>
              <div className="membership-member">
                <span className={`member-tier-icon ${member.tier.toLowerCase()}`}>{member.tier.slice(0, 1)}</span>
                <div className="member-name"><strong>{member.customer}</strong><span>{member.id} · Joined {member.joined}</span></div>
              </div>
              <div className="membership-tier-column"><span className="record-label">Membership</span><strong>{member.tier}</strong></div>
              <div className="membership-usage-column"><span className="record-label">Usage this month</span><strong>{member.visitsThisMonth} visits</strong></div>
              <div className="membership-savings-column"><span className="record-label">Annual savings</span><strong>RM {member.savingsThisYear}</strong></div>
              <div className="membership-renewal-column"><span className="record-label">Renews</span><strong>{member.renews}</strong></div>
              <div className="membership-action-column">
                <span className={`domain-badge ${statusClass[member.status]}`}>{member.status}</span>
                {member.status === 'Renewal Due' && <button className="action-button primary-action" type="button">Renew</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
