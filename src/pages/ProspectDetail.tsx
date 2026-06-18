import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import {
  deals as dealsApi,
  followUps as followUpsApi,
  getProspectWithRelations,
  outreach as outreachApi,
  prospects as prospectsApi,
} from '../lib/api'
import {
  getTemplates,
  renderTemplate,
  type Template,
} from '../lib/templates'
import type {
  Deal,
  DealInsert,
  FollowUp,
  Outreach,
  Prospect,
  ProspectStage,
  ProspectUpdate,
} from '../lib/types'

const STAGE_OPTIONS: ProspectStage[] = [
  'new',
  'contacted',
  'replied',
  'interested',
  'won',
  'lost',
]

const inputClass = 'input'
const labelClass = 'field-label'
const cardClass = 'card p-6'
const primaryBtn = 'btn btn-primary'

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

// ---------------------------------------------------------------------------
// Editable prospect fields
// ---------------------------------------------------------------------------

function ProspectFields({
  prospect,
  onSaved,
}: {
  prospect: Prospect
  onSaved: (p: Prospect) => void
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState<Prospect>(prospect)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setForm(prospect), [prospect])

  const remove = async () => {
    if (
      !window.confirm(
        `Delete "${prospect.business_name}"? This also removes its outreach, follow-ups and deals, and can't be undone.`,
      )
    ) {
      return
    }
    setDeleting(true)
    setError(null)
    try {
      await prospectsApi.remove(prospect.id)
      navigate('/pipeline')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  const dirty = (Object.keys(form) as (keyof Prospect)[]).some(
    (k) => form[k] !== prospect[k],
  )

  const set = <K extends keyof Prospect>(key: K, value: Prospect[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    setError(null)
    const changes: ProspectUpdate = {
      business_name: form.business_name,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      industry: form.industry || null,
      current_website: form.current_website || null,
      website_quality: form.website_quality || null,
      source: form.source || null,
      fit_notes: form.fit_notes || null,
      stage: form.stage,
    }
    try {
      const updated = await prospectsApi.update(prospect.id, changes)
      onSaved(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <input
          className="w-full border-0 p-0 text-2xl font-semibold text-ink focus:outline-none focus:ring-0"
          value={form.business_name}
          onChange={(e) => set('business_name', e.target.value)}
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
          >
            <Trash2 size={15} strokeWidth={2} />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={!dirty || saving}
            onClick={save}
          >
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass}>Contact name</label>
          <input
            className={inputClass}
            value={form.contact_name ?? ''}
            onChange={(e) => set('contact_name', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            className={inputClass}
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            className={inputClass}
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Industry</label>
          <input
            className={inputClass}
            value={form.industry ?? ''}
            onChange={(e) => set('industry', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Current website</label>
          <input
            className={inputClass}
            value={form.current_website ?? ''}
            onChange={(e) => set('current_website', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Website quality</label>
          <input
            className={inputClass}
            value={form.website_quality ?? ''}
            onChange={(e) => set('website_quality', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Source</label>
          <input
            className={inputClass}
            value={form.source ?? ''}
            onChange={(e) => set('source', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Stage</label>
          <select
            className={inputClass}
            value={form.stage}
            onChange={(e) => set('stage', e.target.value as ProspectStage)}
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>Fit notes</label>
        <textarea
          className={inputClass}
          rows={3}
          value={form.fit_notes ?? ''}
          onChange={(e) => set('fit_notes', e.target.value)}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Outreach timeline
// ---------------------------------------------------------------------------

const emptyOutreach = { channel: '', subject: '', body: '', outcome: '' }

function OutreachSection({
  prospect,
  items,
  setItems,
}: {
  prospect: Prospect
  items: Outreach[]
  setItems: React.Dispatch<React.SetStateAction<Outreach[]>>
}) {
  const [form, setForm] = useState(emptyOutreach)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState('')

  // Templates live in localStorage; load them once on mount.
  useEffect(() => setTemplates(getTemplates()), [])

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    if (!id) return
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setForm((prev) => ({
      ...prev,
      subject: renderTemplate(t.subject, prospect),
      body: renderTemplate(t.body, prospect),
    }))
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await outreachApi.create({
        prospect_id: prospect.id,
        channel: form.channel || null,
        subject: form.subject || null,
        body: form.body || null,
        outcome: form.outcome || null,
        sent_at: new Date().toISOString(),
      })
      setItems((prev) => [created, ...prev])
      setForm(emptyOutreach)
      setTemplateId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add outreach')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Outreach</h2>
        {templates.length > 0 ? (
          <select
            className="rounded-md border border-border px-2 py-1.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={templateId}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">Use template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        ) : (
          <Link
            to="/templates"
            className="text-xs text-muted hover:text-ink"
          >
            + Create a template
          </Link>
        )}
      </div>

      <form onSubmit={add} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Channel (email, call, LinkedIn…)"
          value={form.channel}
          onChange={(e) => setForm({ ...form, channel: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <textarea
          className={`${inputClass} sm:col-span-2`}
          placeholder="Body"
          rows={2}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Outcome"
          value={form.outcome}
          onChange={(e) => setForm({ ...form, outcome: e.target.value })}
        />
        <div className="flex items-center justify-end">
          <button type="submit" className={primaryBtn} disabled={saving}>
            {saving ? 'Adding…' : 'Add outreach'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted">No outreach logged yet.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-5">
          {items.map((o) => (
            <li key={o.id} className="relative">
              <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-muted" />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {o.channel && (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-secondary">
                    {o.channel}
                  </span>
                )}
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">
                  {o.direction}
                </span>
                <span>{formatDateTime(o.sent_at)}</span>
              </div>
              {o.subject && (
                <div className="mt-1 font-medium text-ink">
                  {o.subject}
                </div>
              )}
              {o.body && (
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-secondary">
                  {o.body}
                </p>
              )}
              {o.outcome && (
                <div className="mt-1 text-xs text-muted">
                  Outcome: <span className="text-ink">{o.outcome}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

function FollowUpsSection({
  prospectId,
  items,
  setItems,
}: {
  prospectId: string
  items: FollowUp[]
  setItems: React.Dispatch<React.SetStateAction<FollowUp[]>>
}) {
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await followUpsApi.create({
        prospect_id: prospectId,
        due_date: dueDate || null,
        note: note || null,
      })
      setItems((prev) => [...prev, created])
      setDueDate('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add follow-up')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (f: FollowUp) => {
    const previous = items
    setItems((prev) =>
      prev.map((x) => (x.id === f.id ? { ...x, done: !x.done } : x)),
    )
    try {
      await followUpsApi.update(f.id, { done: !f.done })
    } catch (err) {
      setItems(previous)
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="mb-4 text-lg font-semibold text-ink">Follow-ups</h2>

      <form onSubmit={add} className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClass}>Due date *</label>
          <input
            type="date"
            required
            className={inputClass}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Note</label>
          <input
            className={inputClass}
            placeholder="What to do"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted">No follow-ups yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2.5">
              <input
                type="checkbox"
                checked={f.done}
                onChange={() => toggle(f)}
                className="h-4 w-4 rounded border-border text-ink focus:ring-primary"
              />
              <div className="flex-1">
                <span
                  className={
                    f.done ? 'text-muted line-through' : 'text-ink'
                  }
                >
                  {f.note || '(no note)'}
                </span>
              </div>
              <span className="text-xs text-muted">
                {f.due_date ?? 'no date'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

const DEAL_STAGES = ['proposal', 'negotiation', 'won', 'lost']

type DealDraft = {
  package: string
  value: string
  currency: string
  stage: string
  expected_close: string
}

function dealToDraft(d?: Deal): DealDraft {
  return {
    package: d?.package ?? '',
    value: d?.value != null ? String(d.value) : '',
    currency: d?.currency ?? 'AUD',
    stage: d?.stage ?? 'proposal',
    expected_close: d?.expected_close ?? '',
  }
}

function draftToInsert(draft: DealDraft, prospectId: string): DealInsert {
  return {
    prospect_id: prospectId,
    package: draft.package || null,
    value: draft.value ? Number(draft.value) : null,
    currency: draft.currency || 'AUD',
    stage: draft.stage || 'proposal',
    expected_close: draft.expected_close || null,
    closed_at: null,
  }
}

function DealRow({
  deal,
  onSave,
}: {
  deal: Deal
  onSave: (id: string, draft: DealDraft) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DealDraft>(dealToDraft(deal))
  const [saving, setSaving] = useState(false)

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 py-3">
        <div>
          <div className="font-medium text-ink">
            {deal.package || '(no package)'}
          </div>
          <div className="text-xs text-muted">
            {deal.value != null
              ? `${deal.currency} ${deal.value.toLocaleString()}`
              : 'no value'}
            {' · '}
            {deal.stage}
            {deal.expected_close ? ` · close ${deal.expected_close}` : ''}
          </div>
        </div>
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
          onClick={() => {
            setDraft(dealToDraft(deal))
            setEditing(true)
          }}
        >
          Edit
        </button>
      </li>
    )
  }

  return (
    <li className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-5 sm:items-end">
      <input
        className={inputClass}
        placeholder="Package"
        value={draft.package}
        onChange={(e) => setDraft({ ...draft, package: e.target.value })}
      />
      <input
        className={inputClass}
        type="number"
        placeholder="Value"
        value={draft.value}
        onChange={(e) => setDraft({ ...draft, value: e.target.value })}
      />
      <input
        className={inputClass}
        placeholder="Currency"
        value={draft.currency}
        onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
      />
      <select
        className={inputClass}
        value={draft.stage}
        onChange={(e) => setDraft({ ...draft, stage: e.target.value })}
      >
        {DEAL_STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        type="date"
        value={draft.expected_close}
        onChange={(e) =>
          setDraft({ ...draft, expected_close: e.target.value })
        }
      />
      <div className="col-span-2 flex gap-2 sm:col-span-5 sm:justify-end">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm text-secondary hover:bg-surface-2"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          className={primaryBtn}
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            await onSave(deal.id, draft)
            setSaving(false)
            setEditing(false)
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </li>
  )
}

function DealsSection({
  prospectId,
  items,
  setItems,
}: {
  prospectId: string
  items: Deal[]
  setItems: React.Dispatch<React.SetStateAction<Deal[]>>
}) {
  const [draft, setDraft] = useState<DealDraft>(dealToDraft())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await dealsApi.create(draftToInsert(draft, prospectId))
      setItems((prev) => [created, ...prev])
      setDraft(dealToDraft())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add deal')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async (id: string, edited: DealDraft) => {
    const previous = items
    try {
      const updated = await dealsApi.update(id, draftToInsert(edited, prospectId))
      setItems((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      setItems(previous)
      setError(err instanceof Error ? err.message : 'Failed to update deal')
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="mb-4 text-lg font-semibold text-ink">Deals</h2>

      <form
        onSubmit={add}
        className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:items-end"
      >
        <input
          className={inputClass}
          placeholder="Package"
          value={draft.package}
          onChange={(e) => setDraft({ ...draft, package: e.target.value })}
        />
        <input
          className={inputClass}
          type="number"
          placeholder="Value"
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Currency"
          value={draft.currency}
          onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
        />
        <select
          className={inputClass}
          value={draft.stage}
          onChange={(e) => setDraft({ ...draft, stage: e.target.value })}
        >
          {DEAL_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          type="date"
          value={draft.expected_close}
          onChange={(e) =>
            setDraft({ ...draft, expected_close: e.target.value })
          }
        />
        <div className="col-span-2 flex justify-end sm:col-span-5">
          <button type="submit" className={primaryBtn} disabled={saving}>
            {saving ? 'Adding…' : 'Add deal'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted">No deals yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((d) => (
            <DealRow key={d.id} deal={d} onSave={saveEdit} />
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function ProspectDetail() {
  const { id } = useParams<{ id: string }>()
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [outreachItems, setOutreachItems] = useState<Outreach[]>([])
  const [followUpItems, setFollowUpItems] = useState<FollowUp[]>([])
  const [dealItems, setDealItems] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    getProspectWithRelations(id)
      .then((data) => {
        if (!active) return
        const { outreach, follow_ups, deals, ...rest } = data
        setProspect(rest)
        setOutreachItems(
          [...outreach].sort((a, b) =>
            (b.sent_at ?? '').localeCompare(a.sent_at ?? ''),
          ),
        )
        setFollowUpItems(
          [...follow_ups].sort((a, b) =>
            (a.due_date ?? '').localeCompare(b.due_date ?? ''),
          ),
        )
        setDealItems(
          [...deals].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        )
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return <div className="py-20 text-center text-muted">Loading…</div>
  }

  if (error || !prospect) {
    return (
      <div className="py-20 text-center">
        <p className="text-danger">{error ?? 'Prospect not found'}</p>
        <Link to="/pipeline" className="mt-3 inline-block text-sm text-secondary underline">
          ← Back to pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/pipeline" className="inline-block text-sm text-muted hover:text-ink">
        ← Pipeline
      </Link>

      <ProspectFields prospect={prospect} onSaved={setProspect} />

      <OutreachSection
        prospect={prospect}
        items={outreachItems}
        setItems={setOutreachItems}
      />

      <FollowUpsSection
        prospectId={prospect.id}
        items={followUpItems}
        setItems={setFollowUpItems}
      />

      <DealsSection
        prospectId={prospect.id}
        items={dealItems}
        setItems={setDealItems}
      />
    </div>
  )
}

export default ProspectDetail
