import { useEffect, useState } from 'react'
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  PLACEHOLDERS,
  updateTemplate,
  type Template,
} from '../lib/templates'

const inputClass = 'input'
const labelClass = 'field-label'
const cardClass = 'card p-6'
const primaryBtn = 'btn btn-primary'

const emptyDraft = { name: '', subject: '', body: '' }

function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  // Currently edited template id, or 'new' for the create form, or null.
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState(emptyDraft)

  useEffect(() => {
    setTemplates(getTemplates())
  }, [])

  const startNew = () => {
    setDraft(emptyDraft)
    setEditingId('new')
  }

  const startEdit = (t: Template) => {
    setDraft({ name: t.name, subject: t.subject, body: t.body })
    setEditingId(t.id)
  }

  const cancel = () => {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId === 'new') {
      createTemplate(draft)
    } else if (editingId) {
      updateTemplate(editingId, draft)
    }
    setTemplates(getTemplates())
    cancel()
  }

  const remove = (id: string) => {
    if (!confirm('Delete this template?')) return
    deleteTemplate(id)
    setTemplates(getTemplates())
    if (editingId === id) cancel()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            Outreach templates
          </h1>
          <p className="mt-1 text-sm text-muted">
            Reusable subject + body with placeholders:{' '}
            {PLACEHOLDERS.map((p) => (
              <code
                key={p}
                className="mx-0.5 rounded bg-surface-2 px-1 py-0.5 text-xs text-ink"
              >{`{{${p}}}`}</code>
            ))}
          </p>
        </div>
        {editingId === null && (
          <button type="button" className={primaryBtn} onClick={startNew}>
            + New template
          </button>
        )}
      </div>

      {/* Create / edit form */}
      {editingId !== null && (
        <form onSubmit={save} className={`${cardClass} space-y-4`}>
          <h2 className="text-lg font-semibold text-ink">
            {editingId === 'new' ? 'New template' : 'Edit template'}
          </h2>
          <div>
            <label className={labelClass}>Name *</label>
            <input
              className={inputClass}
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Cold intro — outdated site"
            />
          </div>
          <div>
            <label className={labelClass}>Subject</label>
            <input
              className={inputClass}
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              placeholder="Quick idea for {{business_name}}"
            />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea
              className={inputClass}
              rows={6}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder={'Hi {{contact_name}},\n\nI noticed {{business_name}} …'}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-2"
              onClick={cancel}
            >
              Cancel
            </button>
            <button type="submit" className={primaryBtn} disabled={!draft.name}>
              {editingId === 'new' ? 'Create template' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {templates.length === 0 ? (
        <div className={`${cardClass} text-center text-sm text-muted`}>
          No templates yet. Create one to reuse it in outreach.
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.id} className={cardClass}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-ink">{t.name}</div>
                  {t.subject && (
                    <div className="mt-1 text-sm text-secondary">
                      <span className="text-muted">Subject: </span>
                      {t.subject}
                    </div>
                  )}
                  {t.body && (
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                      {t.body}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
                    onClick={() => startEdit(t)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-[10px] px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                    onClick={() => remove(t.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Templates
