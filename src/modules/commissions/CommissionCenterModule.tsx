import {
  Award,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  Gift,
  MinusCircle,
  PackageCheck,
  Plus,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Drawer } from '../../components/Drawer'
import { FormField } from '../../components/FormField'
import {
  commissionAdjustments,
  commissionRules as initialRules,
  commissionStatements,
  therapistCommissions,
} from '../../services/mockOperations'
import type {
  CommissionAppliesTo,
  CommissionCalculation,
  CommissionRule,
} from '../../types/commissions'

type CommissionTab = 'Overview' | 'Rules' | 'Monthly Statements' | 'Adjustments'

const tabs: CommissionTab[] = ['Overview', 'Rules', 'Monthly Statements', 'Adjustments']
const therapistProfiles = {
  'Nok S.': { initials: 'NS', role: 'Senior Wellness Therapist', joined: '14 Aug 2023', branch: 'Bangsar Wellness', rating: 4.9, rebooking: 78, upsell: 32 },
  'Aom M.': { initials: 'AM', role: 'Deep Tissue Specialist', joined: '03 Nov 2023', branch: 'Bangsar Wellness', rating: 4.8, rebooking: 72, upsell: 28 },
  'Mei L.': { initials: 'ML', role: 'Head Spa Specialist', joined: '19 Jan 2024', branch: 'Bangsar Wellness', rating: 4.9, rebooking: 69, upsell: 41 },
  'Pim J.': { initials: 'PJ', role: 'Wellness Therapist', joined: '08 Mar 2024', branch: 'Bangsar Wellness', rating: 4.7, rebooking: 64, upsell: 23 },
}

interface CommissionCenterModuleProps {
  isCreateOpen: boolean
  onCreateOpen: () => void
  onCreateClose: () => void
}

function money(value: number) {
  return `RM ${value.toLocaleString()}`
}

export function CommissionCenterModule({
  isCreateOpen,
  onCreateOpen,
  onCreateClose,
}: CommissionCenterModuleProps) {
  const [activeTab, setActiveTab] = useState<CommissionTab>('Overview')
  const [rules, setRules] = useState(initialRules)
  const [selectedTherapist, setSelectedTherapist] = useState('Nok S.')
  const [month, setMonth] = useState('June 2026')
  const [commissionType, setCommissionType] = useState('All commission')

  const selectedCommission = therapistCommissions.find(
    (item) => item.therapist === selectedTherapist,
  ) ?? therapistCommissions[0]
  const selectedStatement = commissionStatements.find(
    (item) => item.therapist === selectedTherapist,
  ) ?? commissionStatements[0]
  const profile = therapistProfiles[selectedTherapist as keyof typeof therapistProfiles]
  const serviceCommission = Math.round(selectedCommission.commission * 0.72)
  const packageCommission = Math.round(selectedCommission.commission * 0.2)
  const productCommission =
    selectedCommission.commission - serviceCommission - packageCommission
  const deduction = selectedStatement.deductions
  const overallSales =
    selectedCommission.serviceRevenue +
    selectedCommission.packageSales +
    selectedCommission.productSales

  const ranking = useMemo(
    () => [...therapistCommissions].sort((a, b) => b.totalPayout - a.totalPayout),
    [],
  )

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const rule: CommissionRule = {
      id: `CR-${String(rules.length + 1).padStart(2, '0')}`,
      name: String(data.get('name')),
      appliesTo: String(data.get('appliesTo')) as CommissionAppliesTo,
      category: String(data.get('category')),
      calculation: String(data.get('calculation')) as CommissionCalculation,
      rate: String(data.get('rate')),
      effectiveDate: String(data.get('effectiveDate')),
      active: true,
    }
    setRules((current) => [rule, ...current])
    setActiveTab('Rules')
    onCreateClose()
  }

  return (
    <>
      <section className="staff-commission-heading">
        <div>
          <span className="panel-kicker">Employee earnings workspace</span>
          <h2>Staff Commission Management</h2>
          <p>Clear performance, rule, and payout visibility for every therapist.</p>
        </div>
        <div className="commission-period-controls">
          <label>
            <span>Period</span>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              <option>June 2026</option>
              <option>May 2026</option>
              <option>April 2026</option>
            </select>
          </label>
          <label>
            <span>Commission type</span>
            <select value={commissionType} onChange={(event) => setCommissionType(event.target.value)}>
              <option>All commission</option>
              <option>Service only</option>
              <option>Sales only</option>
              <option>Bonus only</option>
            </select>
          </label>
        </div>
      </section>

      <section className="commission-hero">
        <article className="staff-profile-card">
          <div className="staff-profile-top">
            <span className="staff-profile-avatar">{profile.initials}</span>
            <div>
              <select
                aria-label="Selected therapist"
                value={selectedTherapist}
                onChange={(event) => setSelectedTherapist(event.target.value)}
              >
                {therapistCommissions.map((item) => (
                  <option key={item.id}>{item.therapist}</option>
                ))}
              </select>
              <strong>{profile.role}</strong>
            </div>
            <span className="domain-badge success">Active</span>
          </div>
          <div className="staff-profile-details">
            <div><span>Joined</span><strong>{profile.joined}</strong></div>
            <div><span>Branch</span><strong>{profile.branch}</strong></div>
            <div><span>Rating</span><strong><Star size={13} /> {profile.rating}</strong></div>
            <div><span>Sessions</span><strong>{selectedCommission.sessions}</strong></div>
          </div>
          <button className="staff-statement-button" type="button" onClick={() => setActiveTab('Monthly Statements')}>
            <ReceiptText size={15} /> View monthly statement
          </button>
        </article>

        <div className="personal-commission-summary">
          <article className="commission-total-card">
            <div>
              <span>Personal total commission</span>
              <strong>{money(selectedCommission.totalPayout)}</strong>
              <small>{month} · {commissionType}</small>
            </div>
            <div className="commission-total-ring">
              <span>{Math.round((selectedCommission.totalPayout / 5000) * 100)}%</span>
            </div>
          </article>
          <div className="commission-mini-grid">
            <article><Sparkles size={16} /><span>Service</span><strong>{money(serviceCommission)}</strong></article>
            <article><PackageCheck size={16} /><span>Package sales</span><strong>{money(packageCommission)}</strong></article>
            <article><ShoppingBag size={16} /><span>Product sales</span><strong>{money(productCommission)}</strong></article>
            <article className="gold"><Gift size={16} /><span>Bonus</span><strong>{money(selectedCommission.bonus)}</strong></article>
            <article className="deduction"><MinusCircle size={16} /><span>Deductions</span><strong>{money(deduction)}</strong></article>
          </div>
        </div>
      </section>

      <section className="records-panel commission-panel">
        <div className="commission-tabs" role="tablist" aria-label="Commission sections">
          {tabs.map((tab) => (
            <button className={activeTab === tab ? 'is-active' : ''} type="button" role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
          <button className="secondary-button tab-action" type="button" onClick={onCreateOpen}><Plus size={15} /> Add rule</button>
        </div>

        {activeTab === 'Overview' && (
          <div className="commission-overview">
            <section className="commission-section">
              <div className="commission-section-heading">
                <div><span className="panel-kicker">Sales achievement</span><h3>Employee Sales Achievement Data</h3></div>
                <span>{month}</span>
              </div>
              <div className="achievement-grid">
                <article><CalendarDays size={17} /><span>Daily Service Revenue</span><strong>RM 1,920</strong><small>6 completed sessions</small></article>
                <article><CircleDollarSign size={17} /><span>Monthly Service Revenue</span><strong>{money(selectedCommission.serviceRevenue)}</strong><small>78% of monthly target</small></article>
                <article><PackageCheck size={17} /><span>Package Sales</span><strong>{money(selectedCommission.packageSales)}</strong><small>8 package conversions</small></article>
                <article><ShoppingBag size={17} /><span>Retail Product Sales</span><strong>{money(selectedCommission.productSales)}</strong><small>Shoulder balm leads</small></article>
                <article><TrendingUp size={17} /><span>Overall Sales</span><strong>{money(overallSales)}</strong><small>Service and retail contribution</small></article>
                <article className="achievement-highlight"><Award size={17} /><span>Personal Commission Total</span><strong>{money(selectedCommission.totalPayout)}</strong><small>{selectedCommission.status} for payroll</small></article>
              </div>
            </section>

            <div className="commission-two-column">
              <section className="commission-section">
                <div className="commission-section-heading">
                  <div><span className="panel-kicker">Earnings composition</span><h3>Commission Breakdown</h3></div>
                </div>
                <div className="commission-breakdown">
                  {[
                    ['Service Commission', serviceCommission, 72, 'teal'],
                    ['Package Commission', packageCommission, 20, 'mint'],
                    ['Product Commission', productCommission, 8, 'gold'],
                    ['Bonus', selectedCommission.bonus, 10, 'gold'],
                    ['Deductions', deduction, deduction ? 4 : 0, 'danger'],
                  ].map(([label, value, percent, tone]) => (
                    <div className="breakdown-row" key={String(label)}>
                      <div><span>{label}</span><strong>{money(Number(value))}</strong></div>
                      <div className="commission-progress"><span className={String(tone)} style={{ width: `${percent}%` }} /></div>
                      <small>{percent}%</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className="commission-section">
                <div className="commission-section-heading">
                  <div><span className="panel-kicker">Commercial impact</span><h3>Therapist Contribution Breakdown</h3></div>
                </div>
                <div className="contribution-grid">
                  <article><span>Service revenue</span><strong>{money(selectedCommission.serviceRevenue)}</strong><em>Core treatment delivery</em></article>
                  <article><span>Package sales</span><strong>{money(selectedCommission.packageSales)}</strong><em>Long-term care conversion</em></article>
                  <article><span>Product sales</span><strong>{money(selectedCommission.productSales)}</strong><em>At-home wellness support</em></article>
                  <article><span>Rebooking contribution</span><strong>{profile.rebooking}%</strong><em>Guests returning</em></article>
                  <article><span>Upsell contribution</span><strong>{profile.upsell}%</strong><em>Add-ons and upgrades</em></article>
                </div>
              </section>
            </div>

            <div className="commission-two-column rules-payroll-row">
              <section className="commission-section">
                <div className="commission-section-heading">
                  <div><span className="panel-kicker">Calculation clarity</span><h3>Commission Rule Visibility</h3></div>
                  <button type="button" onClick={() => setActiveTab('Rules')}>View all rules</button>
                </div>
                <article className="applied-rule-card">
                  <span className="rule-icon"><FileCheck2 size={18} /></span>
                  <div>
                    <strong>Head Spa Service Commission</strong>
                    <p>10% of net service revenue</p>
                    <small>Effective from 2026-06-01 · Completed appointment basis</small>
                  </div>
                  <span className="domain-badge success">Active</span>
                </article>
                <div className="explainable-note">
                  Every earning links back to a completed appointment or sale and preserves the rule used at calculation time.
                </div>
              </section>

              <section className="commission-section payroll-summary-card">
                <div className="commission-section-heading">
                  <div><span className="panel-kicker">Payroll-ready</span><h3>Monthly Payroll Summary</h3></div>
                  <span className={`domain-badge ${selectedStatement.status === 'Approved' ? 'success' : 'gold'}`}>{selectedStatement.status}</span>
                </div>
                <div className="payroll-lines">
                  <span>Basic salary <strong>{money(selectedStatement.basicSalary)}</strong></span>
                  <span>Service commission <strong>{money(serviceCommission)}</strong></span>
                  <span>Package commission <strong>{money(packageCommission)}</strong></span>
                  <span>Product commission <strong>{money(productCommission)}</strong></span>
                  <span>Bonus <strong>{money(selectedStatement.bonus)}</strong></span>
                  <span>Deductions <strong>- {money(selectedStatement.deductions)}</strong></span>
                  <span className="payroll-total">Net payout <strong>{money(selectedStatement.netPayout)}</strong></span>
                </div>
              </section>
            </div>

            <section className="commission-section">
              <div className="commission-section-heading">
                <div><span className="panel-kicker">Team performance</span><h3>Staff Ranking</h3></div>
              </div>
              <div className="staff-ranking-list">
                {ranking.map((item, index) => {
                  const rankedProfile = therapistProfiles[item.therapist as keyof typeof therapistProfiles]
                  return (
                    <article className={item.therapist === selectedTherapist ? 'is-selected' : ''} key={item.id}>
                      <span className="ranking-number">{index + 1}</span>
                      <span className="ranking-avatar">{rankedProfile.initials}</span>
                      <div className="ranking-name"><strong>{item.therapist}</strong><span>{rankedProfile.role}</span></div>
                      <div><span>Revenue</span><strong>{money(item.serviceRevenue + item.packageSales + item.productSales)}</strong></div>
                      <div><span>Commission</span><strong>{money(item.totalPayout)}</strong></div>
                      <div><span>Rating</span><strong>{rankedProfile.rating} ★</strong></div>
                      <div><span>Rebooking</span><strong>{rankedProfile.rebooking}%</strong></div>
                      <div><span>Upsell</span><strong>{rankedProfile.upsell}%</strong></div>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Rules' && (
          <div className="rule-grid">
            {rules.map((rule) => (
              <article className="rule-card" key={rule.id}>
                <div className="rule-card-top"><span className="rule-icon"><TrendingUp size={17} /></span><span className={`domain-badge ${rule.active ? 'success' : 'neutral'}`}>{rule.active ? 'Active' : 'Inactive'}</span></div>
                <h3>{rule.name}</h3>
                <p>{rule.appliesTo} · {rule.category}</p>
                <div className="rule-rate"><strong>{rule.rate}</strong><span>{rule.calculation}</span></div>
                <small>Effective {rule.effectiveDate}</small>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'Monthly Statements' && (
          <div className="statement-card-grid">
            {commissionStatements.map((item) => (
              <article className="statement-card" key={item.id}>
                <div><span className="statement-avatar">{therapistProfiles[item.therapist as keyof typeof therapistProfiles].initials}</span><div><strong>{item.therapist}</strong><span>{item.period}</span></div><span className={`domain-badge ${item.status === 'Approved' || item.status === 'Paid' ? 'success' : item.status === 'Pending Approval' ? 'gold' : 'neutral'}`}>{item.status}</span></div>
                <div className="statement-values">
                  <span>Basic salary<strong>{money(item.basicSalary)}</strong></span>
                  <span>Commission<strong>{money(item.commission)}</strong></span>
                  <span>Bonus<strong>{money(item.bonus)}</strong></span>
                  <span>Deductions<strong>{money(item.deductions)}</strong></span>
                </div>
                <div className="statement-total"><span>Net payout</span><strong>{money(item.netPayout)}</strong></div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'Adjustments' && (
          <div className="adjustment-list">
            {commissionAdjustments.map((item) => (
              <article key={item.id}>
                <span className={`adjustment-icon ${item.type.toLowerCase()}`}>{item.type === 'Bonus' ? <Gift size={16} /> : item.type === 'Deduction' ? <MinusCircle size={16} /> : <ReceiptText size={16} />}</span>
                <div><strong>{item.reason}</strong><span>{item.therapist} · {item.date}</span></div>
                <div><span>Approved by</span><strong>{item.approvedBy}</strong></div>
                <strong className={item.type === 'Deduction' ? 'negative' : ''}>{item.type === 'Deduction' ? '- ' : '+ '}{money(item.amount)}</strong>
                <span className={`domain-badge ${item.type === 'Bonus' ? 'success' : item.type === 'Deduction' ? 'danger' : 'gold'}`}>{item.type}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <Drawer
        open={isCreateOpen}
        onClose={onCreateClose}
        title="Add Commission Rule"
        eyebrow="Versioned earning policy"
        footer={<><button className="secondary-button" type="button" onClick={onCreateClose}>Cancel</button><button className="primary-button" type="submit" form="commission-rule-form">Save rule</button></>}
      >
        <form className="drawer-form" id="commission-rule-form" onSubmit={handleCreate}>
          <FormField label="Rule name" full><input name="name" required placeholder="e.g. Premium body treatment" /></FormField>
          <FormField label="Applies to"><select name="appliesTo"><option>Service</option><option>Package</option><option>Product</option><option>Membership</option></select></FormField>
          <FormField label="Service or category"><input name="category" required placeholder="All services or category" /></FormField>
          <FormField label="Calculation type"><select name="calculation"><option>Percentage</option><option>Fixed</option><option>Tiered</option></select></FormField>
          <FormField label="Rate"><input name="rate" required placeholder="12% or RM 30" /></FormField>
          <FormField label="Effective date"><input name="effectiveDate" type="date" defaultValue="2026-06-10" required /></FormField>
          <FormField label="Notes" full><textarea name="notes" rows={5} placeholder="Eligibility, exclusions, or approval context" /></FormField>
          <div className="form-assurance"><FileCheck2 size={17} /><span>The effective rule will be snapshotted onto each future commission entry for auditability.</span></div>
        </form>
      </Drawer>
    </>
  )
}
