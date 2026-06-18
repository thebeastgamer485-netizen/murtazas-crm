import { useMemo, useState } from 'react'
import Papa from 'papaparse'
import { prospects as prospectsApi } from '../lib/api'
import type { ProspectInsert } from '../lib/types'

// Prospect fields that can be mapped from CSV columns.
const MAPPABLE_FIELDS = [
  { key: 'business_name', label: 'Business name', required: true },
  { key: 'contact_name', label: 'Contact name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'industry', label: 'Industry', required: false },
  { key: 'current_website', label: 'Current website', required: false },
  { key: 'website_quality', label: 'Website quality', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'fit_notes', label: 'Fit notes', required: false },
] as const

type FieldKey = (typeof MAPPABLE_FIELDS)[number]['key']

type CsvRow = Record<string, string>

// Field -> CSV column header. Empty string means "not mapped".
type Mapping = Record<FieldKey, string>

const UNMAPPED = ''

interface ImportCsvModalProps {
  open: boolean
  onClose: () => void
  onImported: (insertedCount: number) => void
}

// Guess a mapping by matching field keys/labels against CSV headers.
function autoMap(headers: string[]): Mapping {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const byNorm = new Map(headers.map((h) => [norm(h), h]))
  const mapping = {} as Mapping
  for (const field of MAPPABLE_FIELDS) {
    const candidates = [field.key, field.label].map(norm)
    const hit = candidates.map((c) => byNorm.get(c)).find(Boolean)
    mapping[field.key] = hit ?? UNMAPPED
  }
  return mapping
}

function ImportCsvModal({ open, onClose, onImported }: ImportCsvModalProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<CsvRow[]>([])
  const [mapping, setMapping] = useState<Mapping | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    imported: number
    skipped: number
  } | null>(null)

  const reset = () => {
    setFileName(null)
    setHeaders([])
    setRows([])
    setMapping(null)
    setParseError(null)
    setImporting(false)
    setImportError(null)
    setResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = (file: File) => {
    setParseError(null)
    setResult(null)
    setFileName(file.name)
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const fields = res.meta.fields ?? []
        if (fields.length === 0) {
          setParseError('No columns found in this file.')
          return
        }
        setHeaders(fields)
        setRows(res.data)
        setMapping(autoMap(fields))
      },
      error: (err) => setParseError(err.message),
    })
  }

  // Build prospect rows from the current mapping, splitting valid vs skipped.
  const { validRows, skipped } = useMemo(() => {
    if (!mapping) return { validRows: [] as ProspectInsert[], skipped: 0 }
    const bnCol = mapping.business_name
    const out: ProspectInsert[] = []
    let skip = 0
    for (const row of rows) {
      const businessName = bnCol ? (row[bnCol] ?? '').trim() : ''
      if (!businessName) {
        skip += 1
        continue
      }
      const value = (key: FieldKey): string | null => {
        const col = mapping[key]
        if (!col) return null
        const v = (row[col] ?? '').trim()
        return v === '' ? null : v
      }
      out.push({
        business_name: businessName,
        contact_name: value('contact_name'),
        email: value('email'),
        phone: value('phone'),
        industry: value('industry'),
        current_website: value('current_website'),
        website_quality: value('website_quality'),
        source: value('source'),
        fit_notes: value('fit_notes'),
        stage: 'new',
      })
    }
    return { validRows: out, skipped: skip }
  }, [mapping, rows])

  const businessNameMapped = !!mapping?.business_name

  const handleImport = async () => {
    setImporting(true)
    setImportError(null)
    try {
      const inserted = await prospectsApi.createMany(validRows, 100)
      setResult({ imported: inserted, skipped })
      onImported(inserted)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  if (!open) return null

  const selectClass =
    'input'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={handleClose}
    >
      <div
        className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">
            Import prospects from CSV
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {/* Result state */}
          {result ? (
            <div className="space-y-4">
              <div className="rounded-[12px] border border-won/30 bg-won-soft px-4 py-3 text-sm text-won-text">
                Imported <strong>{result.imported}</strong>{' '}
                prospect{result.imported === 1 ? '' : 's'}.{' '}
                {result.skipped > 0 && (
                  <>
                    Skipped <strong>{result.skipped}</strong> row
                    {result.skipped === 1 ? '' : 's'} with no business name.
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="btn btn-ghost"
                >
                  Import another
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File picker */}
              <div>
                <label className="mb-1 block text-xs font-medium text-secondary">
                  CSV file
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                  className="block w-full text-sm text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-on-primary hover:file:bg-primary-hover"
                />
                {fileName && (
                  <p className="mt-1 text-xs text-muted">
                    {fileName} · {rows.length} data row
                    {rows.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>

              {parseError && (
                <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {parseError}
                </div>
              )}

              {/* Mapping step */}
              {mapping && headers.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-ink">
                    Map columns
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {MAPPABLE_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1 block text-xs font-medium text-secondary">
                          {field.label}
                          {field.required && (
                            <span className="text-red-600"> *</span>
                          )}
                        </label>
                        <select
                          className={selectClass}
                          value={mapping[field.key]}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              [field.key]: e.target.value,
                            })
                          }
                        >
                          <option value={UNMAPPED}>
                            {field.required ? '— select column —' : '— skip —'}
                          </option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {!businessNameMapped && (
                    <p className="mt-2 text-xs text-red-600">
                      Map a column to Business name to continue.
                    </p>
                  )}
                </div>
              )}

              {/* Preview */}
              {mapping && businessNameMapped && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-ink">
                    Preview{' '}
                    <span className="font-normal text-muted">
                      (first 5 of {validRows.length} importable
                      {skipped > 0 ? `, ${skipped} will be skipped` : ''})
                    </span>
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-surface-2">
                        <tr>
                          {MAPPABLE_FIELDS.filter(
                            (f) => mapping[f.key],
                          ).map((f) => (
                            <th
                              key={f.key}
                              className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-secondary"
                            >
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {validRows.slice(0, 5).map((r, i) => (
                          <tr key={i}>
                            {MAPPABLE_FIELDS.filter(
                              (f) => mapping[f.key],
                            ).map((f) => (
                              <td
                                key={f.key}
                                className="whitespace-nowrap px-3 py-2 text-ink"
                              >
                                {r[f.key] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {validRows.length === 0 && (
                          <tr>
                            <td
                              colSpan={MAPPABLE_FIELDS.length}
                              className="px-3 py-4 text-center text-muted"
                            >
                              No importable rows.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importError && (
                <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {importError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={
                    importing || !businessNameMapped || validRows.length === 0
                  }
                  className="btn btn-primary disabled:opacity-50"
                >
                  {importing
                    ? 'Importing…'
                    : `Import ${validRows.length} prospect${
                        validRows.length === 1 ? '' : 's'
                      }`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportCsvModal
