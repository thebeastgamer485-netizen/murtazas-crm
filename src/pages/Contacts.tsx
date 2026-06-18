import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Mail, Phone, X } from 'lucide-react'
import { contacts as contactsApi } from '../lib/api'
import type { Contact, ContactInsert } from '../lib/types'
import ContactFormModal from '../components/ContactFormModal'

function Contacts() {
  const [items, setItems] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    contactsApi
      .list()
      .then((data) => active && setItems(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((c) =>
      [c.name, c.email, c.phone, c.company, c.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [items, query])

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (c: Contact) => {
    setEditing(c)
    setModalOpen(true)
  }

  const handleSubmit = async (values: ContactInsert) => {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const updated = await contactsApi.update(editing.id, values)
        setItems((prev) =>
          prev
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
      } else {
        const created = await contactsApi.create(values)
        setItems((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
        )
      }
      setModalOpen(false)
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save contact')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Contact) => {
    if (!window.confirm(`Delete "${c.name}"? This can't be undone.`)) return
    const previous = items
    setItems((prev) => prev.filter((x) => x.id !== c.id))
    try {
      await contactsApi.remove(c.id)
    } catch (e) {
      setItems(previous)
      setError(e instanceof Error ? e.message : 'Failed to delete contact')
    }
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Contacts</h1>
          <p className="mt-1.5 text-sm text-secondary">
            {items.length} contact{items.length === 1 ? '' : 's'}
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          Add contact
        </button>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className="input pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-[12px] border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm text-danger">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="text-danger/70 transition-colors hover:text-danger"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-muted">Loading contacts…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">
            {items.length === 0
              ? 'No contacts yet. Add your first one.'
              : 'No contacts match your search.'}
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-active">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display font-semibold text-ink">
                    {c.name}
                  </span>
                  {c.company && (
                    <span className="text-sm text-muted">· {c.company}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-center gap-1.5 hover:text-primary"
                    >
                      <Mail size={13} strokeWidth={2} />
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={13} strokeWidth={2} />
                      {c.phone}
                    </span>
                  )}
                </div>
                {c.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">
                    {c.notes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  aria-label={`Edit ${c.name}`}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <Pencil size={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  aria-label={`Delete ${c.name}`}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ContactFormModal
        open={modalOpen}
        saving={saving}
        initial={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default Contacts
