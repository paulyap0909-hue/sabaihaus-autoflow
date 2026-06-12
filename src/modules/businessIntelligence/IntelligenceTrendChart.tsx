interface ChartSeries {
  label: string
  color: 'teal' | 'gold' | 'mint'
  values: Array<number | undefined>
  dashed?: boolean
}

interface IntelligenceTrendChartProps {
  labels: string[]
  series: ChartSeries[]
  valueFormatter?: (value: number) => string
}

const colors = {
  teal: '#0d6663',
  gold: '#bc9c5c',
  mint: '#76aea8',
}

function buildPath(values: Array<number | undefined>, maximum: number) {
  const points = values
    .map((value, index) => {
      if (value === undefined) return null
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100
      const y = 88 - (value / maximum) * 72
      return `${x},${y}`
    })
    .filter(Boolean)

  return points.join(' ')
}

export function IntelligenceTrendChart({
  labels,
  series,
  valueFormatter = (value) => value.toLocaleString(),
}: IntelligenceTrendChartProps) {
  const values = series.flatMap((item) =>
    item.values.filter((value): value is number => value !== undefined),
  )
  const maximum = Math.max(...values, 1) * 1.08
  const latestValues = series.map((item) => {
    const defined = item.values.filter(
      (value): value is number => value !== undefined,
    )
    return defined.at(-1) ?? 0
  })

  return (
    <div className="intelligence-chart">
      <div className="intelligence-chart-legend">
        {series.map((item, index) => (
          <span key={item.label}>
            <i className={item.color} />
            {item.label}
            <strong>{valueFormatter(latestValues[index])}</strong>
          </span>
        ))}
      </div>

      <div className="intelligence-chart-canvas">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label="Business trend chart"
        >
          {[16, 34, 52, 70, 88].map((line) => (
            <line
              x1="0"
              x2="100"
              y1={line}
              y2={line}
              className="intelligence-grid-line"
              key={line}
            />
          ))}
          {series.map((item) => (
            <polyline
              key={item.label}
              points={buildPath(item.values, maximum)}
              fill="none"
              stroke={colors[item.color]}
              strokeDasharray={item.dashed ? '3 3' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div
        className="intelligence-chart-labels"
        style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}
      >
        {labels.map((label) => <span key={label}>{label}</span>)}
      </div>
    </div>
  )
}
