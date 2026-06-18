import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload, Search, Flame, X, Trash2 } from 'lucide-react'
import { prospects as prospectsApi } from '../lib/api'
import type { Prospect, ProspectInsert, ProspectStage } from '../lib/types'
import ProspectFormModal from './ProspectFormModal'
import ImportCsvModal from './ImportCsvModal'

const STAGES: { key: ProspectStage; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'var(--color-stage-new)' },
  { key: 'contacted', label: 'Contacted', color: 'var(--color-stage-contacted)' },
  { key: 'replied', label: 'Replied', color: 'var(--color-stage-replied)' },
  { key: 'interested', label: 'Interested', color: 'var(--color-stage-interested)' },
  { key: 'won', label: 'Won', color: 'var(--color-stage-won)' },
  { key: 'lost', label: 'Lost', color: 'var(--color-stage-lost)' },
]

// Website-quality values that mark a prospect as a hot lead.
const HOT_QUALITY = new Set(['none', 'outdated'])

function QualityBadge({ quality }: { quality: string | null }) {
  if (!quality) return null
  const hot = HOT_QUALITY.has(quality.toLowerCase())
  if (hot) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-hot-soft px-2 py-0.5 text-[11px] font-semibold text-hot-text">
        <Flame size={12} strokeWidth={2.5} />
        {quality}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-secondary">
      {quality}
    </span>
  )
}

interface ProspectCardProps {
  prospect: Prospect
  dragging: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDelete: (id: string) => void
}

function ProspectCard({
  prospect,
  dragging,
  onDragStart,
  onDragEnd,
  onDelete,
}: ProspectCardProps) {
  const contactInitial =
    prospect.contact_name?.charAt(0).toUpperCase() ?? null
  const isHot =
    !!prospect.website_quality &&
    HOT_QUALITY.has(prospect.website_quality.toLowerCase())
  return (
    <div
      draggable
      onDragStart={() => onDragStart(prospect.id)}
      onDragEnd={onDragEnd}
      className={`group relative cursor-grab rounded-xl border border-border bg-surface p-3.5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md active:cursor-grabbing ${
        dragging ? 'rotate-[1.5deg] opacity-60 shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/prospects/${prospect.id}`}
          draggable={false}
          className="font-display text-[14.5px] font-semibold leading-snug text-ink hover:text-primary"
        >
          {prospect.business_name}
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {isHot && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-hot-soft px-2 py-0.5 text-[10.5px] font-semibold text-hot-text">
              <Flame size={11} strokeWidth={2.5} />
              Hot
            </span>
          )}
          <button
            type="button"
            aria-label={`Delete ${prospect.business_name}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(prospect.id)
            }}
            className="rounded-md p-1 text-muted opacity-0 transition-all hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
      {prospect.industry && (
        <div className="mt-1 text-xs text-muted">{prospect.industry}</div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        {prospect.website_quality &&
        !HOT_QUALITY.has(prospect.website_quality.toLowerCase()) ? (
          <QualityBadge quality={prospect.website_quality} />
        ) : (
          <span />
        )}
        {contactInitial && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary-active"
            title={prospect.contact_name ?? ''}
          >
            {contactInitial}
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineBoard() {
  const [items, setItems] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<ProspectStage | null>(null)

  // Search & filters
  const [query, setQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [qualityFilter, setQualityFilter] = useState('')
  const [hotOnly, setHotOnly] = useState(false)

  const refresh = async () => {
    try {
      setItems(await prospectsApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prospects')
    }
  }

  useEffect(() => {
    let active = true
    prospectsApi
      .list()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Distinct dropdown values, derived from the loaded prospects.
  const industries = useMemo(
    () =>
      Array.from(
        new Set(items.map((p) => p.industry).filter((v): v is string => !!v)),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  )
  const qualities = useMemo(
    () =>
      Array.from(
        new Set(
          items.map((p) => p.website_quality).filter((v): v is string => !!v),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  )

  // Apply search + filters across the whole board.
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((p) => {
      if (q) {
        const haystack = [p.business_name, p.contact_name, p.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (industryFilter && p.industry !== industryFilter) return false
      if (qualityFilter && p.website_quality !== qualityFilter) return false
      if (
        hotOnly &&
        !(p.website_quality && HOT_QUALITY.has(p.website_quality.toLowerCase()))
      ) {
        return false
      }
      return true
    })
  }, [items, query, industryFilter, qualityFilter, hotOnly])

  const filtersActive =
    !!query || !!industryFilter || !!qualityFilter || hotOnly

  const clearFilters = () => {
    setQuery('')
    setIndustryFilter('')
    setQualityFilter('')
    setHotOnly(false)
  }

  const byStage = useMemo(() => {
    const map: Record<ProspectStage, Prospect[]> = {
      new: [],
      contacted: [],
      replied: [],
      interested: [],
      won: [],
      lost: [],
    }
    for (const p of filteredItems) {
      if (map[p.stage]) map[p.stage].push(p)
    }
    return map
  }, [filteredItems])

  const handleDrop = async (stage: ProspectStage) => {
    const id = draggingId
    setDragOverStage(null)
    setDraggingId(null)
    if (!id) return

    const current = items.find((p) => p.id === id)
    if (!current || current.stage === stage) return

    // Optimistic update; roll back if Supabase rejects it.
    const previous = items
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)))
    try {
      await prospectsApi.update(id, { stage })
    } catch (e) {
      setItems(previous)
      setError(e instanceof Error ? e.message : 'Failed to update stage')
    }
  }

  const handleDelete = async (id: string) => {
    const target = items.find((p) => p.id === id)
    if (!target) return
    if (
      !window.confirm(
        `Delete "${target.business_name}"? This can't be undone.`,
      )
    ) {
      return
    }
    const previous = items
    setItems((prev) => prev.filter((p) => p.id !== id))
    try {
      await prospectsApi.remove(id)
    } catch (e) {
      setItems(previous)
      setError(e instanceof Error ? e.message : 'Failed to delete prospect')
    }
  }

  const handleCreate = async (values: ProspectInsert) => {
    setSaving(true)
    try {
      const created = await prospectsApi.create(values)
      setItems((prev) => [created, ...prev])
      setModalOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create prospect')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Pipeline</h1>
          <p className="mt-1.5 text-sm text-secondary">
            {filtersActive
              ? `${filteredItems.length} of ${items.length} prospect${
                  items.length === 1 ? '' : 's'
                }`
              : `${items.length} prospect${items.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="btn btn-ghost"
          >
            <Upload size={16} strokeWidth={2} />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} strokeWidth={2.5} />
            New prospect
          </button>
        </div>
      </div>

      {/* Search & filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, contact, or email…"
            className="input pl-9"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All industries</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <select
          value={qualityFilter}
          onChange={(e) => setQualityFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All website quality</option>
          {qualities.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
        <label
          className={`flex cursor-pointer select-none items-center gap-2 rounded-[8px] border px-3 py-2 text-sm font-medium transition-colors ${
            hotOnly
              ? 'border-hot bg-hot-soft text-hot-text'
              : 'border-border bg-surface text-secondary hover:bg-surface-2'
          }`}
        >
          <input
            type="checkbox"
            checked={hotOnly}
            onChange={(e) => setHotOnly(e.target.checked)}
            className="sr-only"
          />
          <Flame size={15} strokeWidth={2.25} />
          Hot leads only
        </label>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-ink"
          >
            <X size={15} strokeWidth={2} />
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-[12px] border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-danger/70 transition-colors hover:text-danger"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-muted">Loading pipeline…</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(({ key, label, color }) => {
            const over = dragOverStage === key
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverStage(key)
                }}
                onDragLeave={() =>
                  setDragOverStage((s) => (s === key ? null : s))
                }
                onDrop={() => handleDrop(key)}
                className={`flex min-w-[140px] flex-1 basis-0 flex-col overflow-hidden rounded-2xl border bg-surface-2/70 transition-all duration-150 ${
                  over
                    ? 'border-primary ring-2 ring-primary/35'
                    : 'border-border'
                }`}
                style={{ borderTop: `3px solid ${color}` }}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="font-display text-sm font-semibold text-ink">
                      {label}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      color,
                      background: `color-mix(in srgb, ${color} 12%, white)`,
                    }}
                  >
                    {byStage[key].length}
                  </span>
                </div>
                <div className="flex min-h-[80px] flex-col gap-2.5 px-3 pb-3">
                  {byStage[key].map((p) => (
                    <ProspectCard
                      key={p.id}
                      prospect={p}
                      dragging={draggingId === p.id}
                      onDragStart={setDraggingId}
                      onDragEnd={() => setDraggingId(null)}
                      onDelete={handleDelete}
                    />
                  ))}
                  {byStage[key].length === 0 && (
                    <div
                      className={`rounded-xl border border-dashed py-8 text-center text-xs transition-colors ${
                        over
                          ? 'border-primary bg-primary-soft text-primary-active'
                          : 'border-border-strong text-muted'
                      }`}
                    >
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProspectFormModal
        open={modalOpen}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
      />
    </div>
  )
}

export default PipelineBoard
