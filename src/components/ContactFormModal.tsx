import { useEffect, useState } from 'react'
import type { Contact, ContactInsert } from '../lib/types'

const emptyForm: ContactInsert = {
  name: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
}

interface ContactFormModalProps {
  open: boolean
  saving?: boolean
  /** When set, the modal is in edit mode and pre-fills from this contact. */
  initial?: Contact | null
  onClose: () => void
  onSubmit: (values: ContactInsert) => void
}

function ContactFormModal({
  open,
  saving = false,
  initial,
  onClose,
  onSubmit,
}: ContactFormModalProps) {
  const [form, setForm] = useState<ContactInsert>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            name: initial.name,
            email: initial.email ?? '',
            phone: initial.phone ?? '',
            company: initial.company ?? '',
            notes: initial.notes ?? '',
          }
        : emptyForm,
    )
  }, [open, initial])

  if (!open) return null

  const set = <K extends keyof ContactInsert>(key: K, value: ContactInsert[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      notes: form.notes || null,
    })
  }

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
          <h2 className="text-lg font-semibold text-ink">
            {initial ? 'Edit contact' : 'New contact'}
          </h2>
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
            <label className="field-label" htmlFor="contact_name">
              Name *
            </label>
            <input
              id="contact_name"
              className="input"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="contact_email">
                Email
              </label>
              <input
                id="contact_email"
                type="email"
                className="input"
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="contact_phone">
                Phone
              </label>
              <input
                id="contact_phone"
                className="input"
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="contact_company">
              Company
            </label>
            <input
              id="contact_company"
              className="input"
              value={form.company ?? ''}
              onChange={(e) => set('company', e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="contact_notes">
              Notes
            </label>
            <textarea
              id="contact_notes"
              className="input"
              rows={4}
              placeholder="Anything worth remembering about this contact…"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="btn btn-primary"
            >
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Add contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactFormModal
