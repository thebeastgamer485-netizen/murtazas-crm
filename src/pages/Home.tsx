import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, CalendarClock } from 'lucide-react'
import { followUps as followUpsApi, prospects as prospectsApi } from '../lib/api'
import type { FollowUp, Prospect, ProspectStage } from '../lib/types'

const STAGES: { key: ProspectStage; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'var(--color-stage-new)' },
  { key: 'contacted', label: 'Contacted', color: 'var(--color-stage-contacted)' },
  { key: 'replied', label: 'Replied', color: 'var(--color-stage-replied)' },
  { key: 'interested', label: 'Interested', color: 'var(--color-stage-interested)' },
  { key: 'won', label: 'Won', color: 'var(--color-stage-won)' },
  { key: 'lost', label: 'Lost', color: 'var(--color-stage-lost)' },
]

const HOT_QUALITY = new Set(['none', 'outdated'])
const HOT_STAGES = new Set<ProspectStage>(['new', 'contacted'])

// Local calendar date as YYYY-MM-DD (matches a Postgres `date` column).
function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [dueFollowUps, setDueFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = todayISO()

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([prospectsApi.list(), followUpsApi.listDue(today)])
      .then(([p, f]) => {
        if (!active) return
        setProspects(p)
        setDueFollowUps(f)
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [today])

  const prospectsById = useMemo(() => {
    const m = new Map<string, Prospect>()
    for (const p of prospects) m.set(p.id, p)
    return m
  }, [prospects])

  const stageCounts = useMemo(() => {
    const counts: Record<ProspectStage, number> = {
      new: 0,
      contacted: 0,
      replied: 0,
      interested: 0,
      won: 0,
      lost: 0,
    }
    for (const p of prospects) {
      if (counts[p.stage] !== undefined) counts[p.stage] += 1
    }
    return counts
  }, [prospects])

  const hotLeads = useMemo(
    () =>
      prospects.filter(
        (p) =>
          p.website_quality != null &&
          HOT_QUALITY.has(p.website_quality.toLowerCase()) &&
          HOT_STAGES.has(p.stage),
      ),
    [prospects],
  )

  if (loading) {
    return <div className="py-24 text-center text-muted">Loading…</div>
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1.5 text-sm text-secondary">
          Your pipeline at a glance.
        </p>
      </div>

      {error && (
        <div className="rounded-[12px] border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Pipeline counts */}
      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Pipeline</h2>
          <Link
            to="/pipeline"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Open board
            <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map(({ key, label, color }) => (
            <Link
              key={key}
              to="/pipeline"
              className="group rounded-xl border border-border bg-surface-2/60 p-4 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <div className="font-display text-2xl font-bold text-ink">
                {stageCounts[key]}
              </div>
              <div className="mt-1 text-xs font-medium text-secondary">
                {label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Follow-ups due today or overdue */}
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock size={18} strokeWidth={2} className="text-secondary" />
            <h2 className="text-lg font-semibold text-ink">Follow-ups due</h2>
          </div>
          {dueFollowUps.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing due — you're all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {dueFollowUps.map((f) => {
                const prospect = prospectsById.get(f.prospect_id)
                const overdue = !!f.due_date && f.due_date < today
                return (
                  <li key={f.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      to={`/prospects/${f.prospect_id}`}
                      className="group flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-ink group-hover:text-primary">
                          {prospect?.business_name ?? 'Unknown prospect'}
                        </div>
                        <div className="mt-0.5 text-sm text-secondary">
                          {f.note || '(no note)'}
                        </div>
                      </div>
                      <span
                        className={
                          overdue
                            ? 'whitespace-nowrap rounded-full bg-hot-soft px-2.5 py-0.5 text-xs font-semibold text-hot-text'
                            : 'whitespace-nowrap rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-secondary'
                        }
                      >
                        {overdue ? 'Overdue · ' : 'Today · '}
                        {f.due_date}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Hot leads */}
        <section className="card p-6">
          <div className="mb-1 flex items-center gap-2">
            <Flame size={18} strokeWidth={2} className="text-hot" />
            <h2 className="text-lg font-semibold text-ink">Hot leads</h2>
          </div>
          <p className="mb-4 text-xs text-muted">
            Weak website (none / outdated) and still early in the pipeline.
          </p>
          {hotLeads.length === 0 ? (
            <p className="text-sm text-muted">No hot leads right now.</p>
          ) : (
            <ul className="divide-y divide-border">
              {hotLeads.map((p) => (
                <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/prospects/${p.id}`}
                    className="group flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-ink group-hover:text-primary">
                        {p.business_name}
                      </div>
                      {p.industry && (
                        <div className="text-xs text-muted">{p.industry}</div>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-hot-soft px-2.5 py-0.5 text-xs font-semibold text-hot-text">
                      <Flame size={12} strokeWidth={2.5} />
                      {p.website_quality}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default Home
