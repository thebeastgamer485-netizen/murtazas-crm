import { useEffect, useState } from 'react'
import type { ProspectInsert, ProspectStage } from '../lib/types'

const STAGE_OPTIONS: ProspectStage[] = [
  'new',
  'contacted',
  'replied',
  'interested',
  'won',
  'lost',
]

const WEBSITE_QUALITY_OPTIONS = [
  'none',
  'outdated',
  'basic',
  'decent',
  'modern',
]

const LEAD_TEMP_OPTIONS = ['hot', 'warm', 'cold']

const emptyForm: ProspectInsert = {
  business_name: '',
  contact_name: '',
  email: '',
  phone: '',
  industry: '',
  current_website: '',
  website_quality: '',
  lead_temp: '',
  source: '',
  fit_notes: '',
  stage: 'new',
}

interface ProspectFormModalProps {
  open: boolean
  saving?: boolean
  onClose: () => void
  onSubmit: (values: ProspectInsert) => void
}

function ProspectFormModal({
  open,
  saving = false,
  onClose,
  onSubmit,
}: ProspectFormModalProps) {
  const [form, setForm] = useState<ProspectInsert>(emptyForm)

  // Reset to a blank form each time the modal is opened.
  useEffect(() => {
    if (open) setForm(emptyForm)
  }, [open])

  if (!open) return null

  const set = <K extends keyof ProspectInsert>(
    key: K,
    value: ProspectInsert[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...form,
      // Send null instead of empty strings for optional columns.
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      industry: form.industry || null,
      current_website: form.current_website || null,
      website_quality: form.website_quality || null,
      lead_temp: form.lead_temp || null,
      source: form.source || null,
      fit_notes: form.fit_notes || null,
    })
  }

  const inputClass = 'input'
  const labelClass = 'field-label'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-border bg-surface shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">New Prospect</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className={labelClass} htmlFor="business_name">
              Business name *
            </label>
            <input
              id="business_name"
              className={inputClass}
              required
              value={form.business_name}
              onChange={(e) => set('business_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="contact_name">
                Contact name
              </label>
              <input
                id="contact_name"
                className={inputClass}
                value={form.contact_name ?? ''}
                onChange={(e) => set('contact_name', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="industry">
                Industry
              </label>
              <input
                id="industry"
                className={inputClass}
                value={form.industry ?? ''}
                onChange={(e) => set('industry', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                className={inputClass}
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="current_website">
                Current website
              </label>
              <input
                id="current_website"
                className={inputClass}
                placeholder="https://…"
                value={form.current_website ?? ''}
                onChange={(e) => set('current_website', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="website_quality">
                Website quality
              </label>
              <input
                id="website_quality"
                className={inputClass}
                list="website-quality-options"
                placeholder="none, outdated, or type your own"
                value={form.website_quality ?? ''}
                onChange={(e) => set('website_quality', e.target.value)}
              />
              <datalist id="website-quality-options">
                {WEBSITE_QUALITY_OPTIONS.map((q) => (
                  <option key={q} value={q} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="lead_temp">
              Lead temperature
            </label>
            <select
              id="lead_temp"
              className={inputClass}
              value={form.lead_temp ?? ''}
              onChange={(e) => set('lead_temp', e.target.value)}
            >
              <option value="">— None —</option>
              {LEAD_TEMP_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="source">
                Source
              </label>
              <input
                id="source"
                className={inputClass}
                placeholder="referral, cold email, …"
                value={form.source ?? ''}
                onChange={(e) => set('source', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="stage">
                Stage
              </label>
              <select
                id="stage"
                className={inputClass}
                value={form.stage}
                onChange={(e) =>
                  set('stage', e.target.value as ProspectStage)
                }
              >
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="fit_notes">
              Fit notes
            </label>
            <textarea
              id="fit_notes"
              className={inputClass}
              rows={3}
              value={form.fit_notes ?? ''}
              onChange={(e) => set('fit_notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : 'Create prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProspectFormModal
