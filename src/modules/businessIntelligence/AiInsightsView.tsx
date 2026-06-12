import {
  ArrowRight,
  BrainCircuit,
  Gauge,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import type { AiBusinessInsight } from '../../types/businessIntelligence'

const categoryIcons = {
  Growth: TrendingUp,
  Retention: UsersRound,
  Capacity: Gauge,
  Risk: ShieldAlert,
}

interface AiInsightsViewProps {
  insights: AiBusinessInsight[]
  generatedAt: string
}

export function AiInsightsView({
  insights,
  generatedAt,
}: AiInsightsViewProps) {
  return (
    <div className="bi-section-grid">
      <section className="ai-intelligence-hero">
        <span className="ai-intelligence-orb"><BrainCircuit size={28} /></span>
        <div>
          <span className="panel-kicker">AI management brief</span>
          <h2>Four actions can materially improve next month.</h2>
          <p>
            This demo brief combines revenue momentum, appointment capacity,
            customer inactivity and package exposure into owner-ready decisions.
          </p>
        </div>
        <div>
          <span><Sparkles size={14} /> Demo-generated insights</span>
          <small>Snapshot {new Date(generatedAt).toLocaleString('en-MY')}</small>
        </div>
      </section>

      <section className="ai-insight-grid">
        {insights.map((insight) => {
          const Icon = categoryIcons[insight.category]
          return (
            <article key={insight.id}>
              <header>
                <span className="ai-insight-icon"><Icon size={18} /></span>
                <div>
                  <span>{insight.category}</span>
                  <small>{insight.priority} priority</small>
                </div>
                <strong>{insight.confidence}%<small>confidence</small></strong>
              </header>
              <h3>{insight.title}</h3>
              <p>{insight.narrative}</p>
              <div className="ai-impact">
                <Lightbulb size={15} />
                <span><small>Potential impact</small><strong>{insight.impact}</strong></span>
              </div>
              <footer>
                <div>
                  <span>Recommended action</span>
                  <strong>{insight.recommendedAction}</strong>
                </div>
                <button type="button" aria-label={`Open ${insight.title}`}>
                  <ArrowRight size={15} />
                </button>
              </footer>
            </article>
          )
        })}
      </section>
    </div>
  )
}
