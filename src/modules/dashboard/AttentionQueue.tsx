import { attentionItems } from '../../services/mockDashboard'

export function AttentionQueue() {
  return (
    <section className="panel attention-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Needs attention</span>
          <h2 className="panel-title">Retention & renewal queue</h2>
        </div>
        <a className="panel-link" href="/customers">
          Open customer CRM
        </a>
      </div>
      <div className="attention-list">
        {attentionItems.map((item) => {
          const Icon = item.icon
          return (
            <article className="attention-item" key={item.id}>
              <span className="attention-icon">
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <div className="attention-copy">
                <div className="attention-title">{item.title}</div>
                <div className="attention-detail">{item.detail}</div>
              </div>
              <strong className="attention-count">{item.count}</strong>
            </article>
          )
        })}
      </div>
    </section>
  )
}
