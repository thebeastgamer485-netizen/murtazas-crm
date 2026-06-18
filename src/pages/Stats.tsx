import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  deals as dealsApi,
  followUps as followUpsApi,
  outreach as outreachApi,
  prospects as prospectsApi,
} from '../lib/api'
import type { Deal, FollowUp, Outreach, Prospect, ProspectStage } from '../lib/types'

const STAGES: { key: ProspectStage; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'replied', label: 'Replied' },
  { key: 'interested', label: 'Interested' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

// Stages that count as "has been contacted" (everyone past 'new').
const CONTACTED_STAGES = new Set<ProspectStage>([
  'contacted',
  'replied',
  'interested',
  'won',
  'lost',
])
// Stages that count as a reply/positive engagement.
const REPLIED_STAGES = new Set<ProspectStage>(['replied', 'interested', 'won'])

function startOfWeek(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sun … 6 = Sat
  const diff = day === 0 ? -6 : 1 - day // back to Monday
  d.setDate(d.getDate() + diff)
  return d
}

function startOfMonth(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const cardClass = 'card p-6'

// Measure a container's width ourselves. recharts' ResponsiveContainer can get
// stuck reporting -1 in some layouts and re-render in a loop; this is reliable.
// Uses a state-backed callback ref so it also measures when the node mounts
// *after* first render (e.g. once a loading state resolves).
function useContainerWidth() {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!node) return
    const update = () => setWidth(node.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => ro.disconnect()
  }, [node])
  return { ref: setNode, width }
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className={cardClass}>
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-secondary">{sub}</div>}
    </div>
  )
}

function Stats() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [outreach, setOutreach] = useState<Outreach[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = todayISO()

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      prospectsApi.list(),
      outreachApi.list(),
      followUpsApi.listDue(today),
      dealsApi.list(),
    ])
      .then(([p, o, f, d]) => {
        if (!active) return
        setProspects(p)
        setOutreach(o)
        setFollowUps(f)
        setDeals(d)
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [today])

  const metrics = useMemo(() => {
    const weekStart = startOfWeek()
    const monthStart = startOfMonth()

    // Stage counts
    const stageCounts = STAGES.map(({ key, label }) => ({
      stage: label,
      count: prospects.filter((p) => p.stage === key).length,
    }))

    // Contacted this week: distinct prospects with outbound outreach since Monday.
    const contactedThisWeek = new Set(
      outreach
        .filter(
          (o) =>
            o.direction === 'outbound' &&
            o.sent_at &&
            new Date(o.sent_at) >= weekStart,
        )
        .map((o) => o.prospect_id),
    ).size

    // Reply rate: (replied + interested + won) / contacted-or-beyond.
    const contacted = prospects.filter((p) =>
      CONTACTED_STAGES.has(p.stage),
    ).length
    const replied = prospects.filter((p) => REPLIED_STAGES.has(p.stage)).length
    const replyRate = contacted > 0 ? replied / contacted : 0

    // Overdue follow-ups: not done and due strictly before today.
    const overdue = followUps.filter(
      (f) => !f.done && f.due_date && f.due_date < today,
    ).length

    // Pipeline value: sum of deal values for deals not lost.
    const pipelineValue = deals
      .filter((d) => d.stage !== 'lost')
      .reduce((sum, d) => sum + (d.value ?? 0), 0)

    // Won value this month: won deals closed since the 1st.
    const wonThisMonth = deals
      .filter(
        (d) =>
          d.stage === 'won' &&
          d.closed_at &&
          new Date(d.closed_at) >= monthStart,
      )
      .reduce((sum, d) => sum + (d.value ?? 0), 0)

    // Use the most common deal currency for display (default AUD).
    const currency = deals[0]?.currency ?? 'AUD'

    return {
      stageCounts,
      contactedThisWeek,
      contacted,
      replied,
      replyRate,
      overdue,
      pipelineValue,
      wonThisMonth,
      currency,
    }
  }, [prospects, outreach, followUps, deals, today])

  const { ref: chartRef, width: chartWidth } = useContainerWidth()

  const fmtMoney = (n: number) =>
    `${metrics.currency} ${n.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`

  if (loading) {
    return <div className="py-24 text-center text-muted">Loading stats…</div>
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Stats</h1>
        <p className="mt-1.5 text-sm text-secondary">
          Cold-outreach metrics across your pipeline.
        </p>
      </div>

      {error && (
        <div className="rounded-[12px] border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total prospects" value={String(prospects.length)} />
        <StatCard
          label="Contacted this week"
          value={String(metrics.contactedThisWeek)}
          sub="Outbound outreach since Monday"
        />
        <StatCard
          label="Reply rate"
          value={`${Math.round(metrics.replyRate * 100)}%`}
          sub={`${metrics.replied} replied of ${metrics.contacted} contacted`}
        />
        <StatCard
          label="Follow-ups overdue"
          value={String(metrics.overdue)}
          sub="Not done, past due date"
        />
        <StatCard
          label="Pipeline value"
          value={fmtMoney(metrics.pipelineValue)}
          sub="All deals not lost"
        />
        <StatCard
          label="Won this month"
          value={fmtMoney(metrics.wonThisMonth)}
          sub="Closed since the 1st"
        />
      </div>

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Prospects per stage
        </h2>
        <div ref={chartRef} className="w-full">
          {chartWidth > 0 && (
            <BarChart
              width={chartWidth}
              height={288}
              data={metrics.stageCounts}
              margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.15)' }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="count"
                fill="#5b47e0"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </div>
      </section>
    </div>
  )
}

export default Stats
