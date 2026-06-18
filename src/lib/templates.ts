import type { Prospect } from './types'

export interface Template {
  id: string
  name: string
  subject: string
  body: string
}

const STORAGE_KEY = 'murtaza-crm:outreach-templates'

// Cheap unique id without pulling in a dependency.
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Template[]) : []
  } catch {
    return []
  }
}

function saveAll(templates: Template[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function createTemplate(input: Omit<Template, 'id'>): Template {
  const template: Template = { id: newId(), ...input }
  saveAll([...getTemplates(), template])
  return template
}

export function updateTemplate(
  id: string,
  changes: Partial<Omit<Template, 'id'>>,
): Template | null {
  const templates = getTemplates()
  const idx = templates.findIndex((t) => t.id === id)
  if (idx === -1) return null
  const updated = { ...templates[idx], ...changes }
  templates[idx] = updated
  saveAll(templates)
  return updated
}

export function deleteTemplate(id: string): void {
  saveAll(getTemplates().filter((t) => t.id !== id))
}

// Fields a prospect exposes to templates.
const PLACEHOLDER_VALUES = (
  prospect: Pick<Prospect, 'business_name' | 'contact_name' | 'industry'>,
): Record<string, string> => ({
  business_name: prospect.business_name ?? '',
  contact_name: prospect.contact_name ?? '',
  industry: prospect.industry ?? '',
})

export const PLACEHOLDERS = ['business_name', 'contact_name', 'industry'] as const

/**
 * Replace {{placeholder}} tokens with the prospect's values.
 * Unknown tokens are left untouched; whitespace inside braces is tolerated.
 */
export function renderTemplate(
  text: string,
  prospect: Pick<Prospect, 'business_name' | 'contact_name' | 'industry'>,
): string {
  const values = PLACEHOLDER_VALUES(prospect)
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  )
}
