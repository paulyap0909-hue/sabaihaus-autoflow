import {
  Activity,
  BatteryMedium,
  BedDouble,
  Brain,
  Eye,
  HeartPulse,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { Drawer } from '../../components/Drawer'
import { OperationalKpi } from '../../components/OperationalKpi'
import { wellnessProfiles } from '../../services/mockPhase3'
import type { WellnessProfile, WellnessRisk, WellnessScores } from '../../types/wellness'

const scoreLabels: Array<{
  key: keyof WellnessScores
  label: string
  positive: boolean
}> = [
  { key: 'stressLevel', label: 'Stress Level', positive: false },
  { key: 'sleepQuality', label: 'Sleep Quality', positive: true },
  { key: 'neckTension', label: 'Neck Tension', positive: false },
  { key: 'shoulderTension', label: 'Shoulder Tension', positive: false },
  { key: 'backPain', label: 'Back Pain', positive: false },
  { key: 'eyeFatigue', label: 'Eye Fatigue', positive: false },
  { key: 'scalpHealth', label: 'Scalp Health', positive: true },
  { key: 'energyLevel', label: 'Energy Level', positive: true },
]

const riskClass: Record<WellnessRisk, string> = {
  Low: 'success',
  Moderate: 'gold',
  High: 'danger',
}

function WellnessScoreGrid({ profile }: { profile: WellnessProfile }) {
  return (
    <div className="wellness-score-grid">
      {scoreLabels.map(({ key, label, positive }) => {
        const value = profile.scores[key]
        const concern = positive ? 10 - value : value
        return (
          <article className="wellness-score" key={key}>
            <div>
              <span>{label}</span>
              <strong>{value}<small>/10</small></strong>
            </div>
            <div className="score-track">
              <span
                className={concern >= 7 ? 'risk-high' : concern >= 4 ? 'risk-medium' : 'risk-low'}
                style={{ width: `${value * 10}%` }}
              />
            </div>
            <small>{positive ? 'Higher is healthier' : 'Lower is healthier'}</small>
          </article>
        )
      })}
    </div>
  )
}

export function WellnessProfilesModule() {
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('All')
  const [selected, setSelected] = useState<WellnessProfile | null>(null)

  const filtered = useMemo(
    () =>
      wellnessProfiles.filter(
        (profile) =>
          (!search || profile.customer.toLowerCase().includes(search.toLowerCase())) &&
          (risk === 'All' || profile.riskLevel === risk),
      ),
    [risk, search],
  )

  return (
    <>
      <section className="operational-kpi-grid four">
        <OperationalKpi label="Assessed Profiles" value={wellnessProfiles.length} detail="Updated care context" icon={HeartPulse} />
        <OperationalKpi label="Average Wellness Score" value="70" detail="+4 points this quarter" icon={Activity} />
        <OperationalKpi label="High Risk Profiles" value={wellnessProfiles.filter((item) => item.riskLevel === 'High').length} detail="Review before treatment" icon={ShieldAlert} tone="gold" />
        <OperationalKpi label="Assessments Due" value="9" detail="More than 60 days old" icon={Sparkles} tone="neutral" />
      </section>

      <section className="wellness-overview">
        <div>
          <span className="panel-kicker">Assessment dashboard</span>
          <h2 className="panel-title">Wellness signals across active guests</h2>
        </div>
        <div className="wellness-insight-chips">
          <span><Brain size={14} /> Stress is the leading concern</span>
          <span><BedDouble size={14} /> 2 guests report low sleep quality</span>
          <span><Eye size={14} /> Eye fatigue is trending upward</span>
        </div>
      </section>

      <section className="filter-panel compact-filters">
        <div className="search-field">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer profile" />
        </div>
        <label className="filter-control">
          <span>Risk level</span>
          <select value={risk} onChange={(event) => setRisk(event.target.value)}>
            <option>All</option><option>Low</option><option>Moderate</option><option>High</option>
          </select>
        </label>
      </section>

      <section className="wellness-profile-grid">
        {filtered.map((profile) => (
          <button className="wellness-profile-card" type="button" key={profile.id} onClick={() => setSelected(profile)}>
            <div className="wellness-card-head">
              <span className="record-avatar">{profile.customer.split(' ').map((part) => part[0]).join('')}</span>
              <div><strong>{profile.customer}</strong><span>Assessed {profile.lastAssessment}</span></div>
              <span className={`domain-badge ${riskClass[profile.riskLevel]}`}>{profile.riskLevel} risk</span>
            </div>
            <div className="overall-score">
              <div><strong>{profile.overallScore}</strong><span>Wellness score</span></div>
              <div className="score-ring" style={{ '--score': `${profile.overallScore * 3.6}deg` } as CSSProperties}><span>{profile.overallScore}</span></div>
            </div>
            <div className="mini-scores">
              <span><Brain size={13} /> Stress <strong>{profile.scores.stressLevel}</strong></span>
              <span><BatteryMedium size={13} /> Energy <strong>{profile.scores.energyLevel}</strong></span>
              <span><Activity size={13} /> Back <strong>{profile.scores.backPain}</strong></span>
            </div>
            <p>{profile.recommendations[0]}</p>
          </button>
        ))}
      </section>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.customer ?? ''}
        eyebrow="Wellness profile"
        wide
        footer={<button className="primary-button" type="button">Record new assessment</button>}
      >
        {selected && (
          <div className="wellness-drawer">
            <section className="wellness-drawer-summary">
              <div><span>Overall score</span><strong>{selected.overallScore}<small>/100</small></strong></div>
              <div><span>Risk level</span><strong className={`risk-text ${selected.riskLevel.toLowerCase()}`}>{selected.riskLevel}</strong></div>
              <div><span>Last assessment</span><strong>{selected.lastAssessment}</strong></div>
            </section>
            <h3 className="drawer-section-title">Wellness score cards</h3>
            <WellnessScoreGrid profile={selected} />
            <section className="recommendation-card">
              <span><Sparkles size={16} /> Treatment recommendations</span>
              {selected.recommendations.map((recommendation) => <p key={recommendation}>{recommendation}</p>)}
            </section>
            <section className="profile-section">
              <h3>Wellness notes</h3>
              <p className="profile-note">{selected.notes}</p>
            </section>
            <section className="profile-section">
              <h3>Wellness journey</h3>
              <div className="journey-timeline">
                {selected.journey.map((event) => (
                  <article key={`${event.date}-${event.title}`}>
                    <span />
                    <div><strong>{event.title}</strong><small>{event.date} · Score {event.score}</small><p>{event.detail}</p></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </>
  )
}
