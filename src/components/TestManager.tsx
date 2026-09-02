import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { addDays, daysUntil, formatDate, todayISO } from '../storage'
import type { TestInput, TestRecord, TestResult, TestStatus } from '../types'
import { Modal } from './Modal'

const emptyForm = (): TestInput => ({
  profileName: '',
  linkedinUrl: '',
  email: '',
  startTestDate: todayISO(),
  endTestDate: addDays(todayISO(), 3),
  status: 'pending',
  result: null,
  answers: '',
  notes: '',
})

interface TestManagerProps {
  tests: TestRecord[]
  onAdd: (input: TestInput) => void
  onUpdate: (id: string, input: TestInput) => void
  onDelete: (id: string) => void
  focusId: string | null
  onFocusHandled: () => void
}

const statusStyles: Record<TestStatus, string> = {
  pending: 'bg-warn-soft text-warn ring-1 ring-orange-200/80',
  end: 'bg-surface text-ink-muted ring-1 ring-line',
  fresh: 'bg-fresh-soft text-fresh ring-1 ring-sky-200/80',
}

export function TestManager({
  tests,
  onAdd,
  onUpdate,
  onDelete,
  focusId,
  onFocusHandled,
}: TestManagerProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TestStatus>('all')
  const [editing, setEditing] = useState<TestRecord | null>(null)
  const [creating, setCreating] = useState(false)
  const [answersOf, setAnswersOf] = useState<TestRecord | null>(null)
  const [form, setForm] = useState<TestInput>(emptyForm())
  const [waitDays, setWaitDays] = useState(3)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tests.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (!q) return true
      return [t.profileName, t.email, t.linkedinUrl, t.notes, t.answers]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [tests, query, statusFilter])

  const openCreate = () => {
    const start = todayISO()
    setWaitDays(3)
    setForm({ ...emptyForm(), startTestDate: start, endTestDate: addDays(start, 3) })
    setCreating(true)
    setEditing(null)
  }

  const openEdit = (t: TestRecord) => {
    setForm({
      profileName: t.profileName,
      linkedinUrl: t.linkedinUrl,
      email: t.email,
      startTestDate: t.startTestDate,
      endTestDate: t.endTestDate,
      status: t.status,
      result: t.result,
      answers: t.answers,
      notes: t.notes,
    })
    setEditing(t)
    setCreating(false)
  }

  useEffect(() => {
    if (!focusId) return
    const t = tests.find((x) => x.id === focusId)
    if (!t) return
    setForm({
      profileName: t.profileName,
      linkedinUrl: t.linkedinUrl,
      email: t.email,
      startTestDate: t.startTestDate,
      endTestDate: t.endTestDate,
      status: t.status,
      result: t.result,
      answers: t.answers,
      notes: t.notes,
    })
    setEditing(t)
    setCreating(false)
    onFocusHandled()
  }, [focusId, tests, onFocusHandled])

  const closeForm = () => {
    setCreating(false)
    setEditing(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) onUpdate(editing.id, form)
    else onAdd(form)
    closeForm()
  }

  const setResult = (t: TestRecord, result: TestResult) => {
    onUpdate(t.id, {
      profileName: t.profileName,
      linkedinUrl: t.linkedinUrl,
      email: t.email,
      startTestDate: t.startTestDate,
      endTestDate: t.endTestDate,
      status: result ? 'end' : t.status,
      result,
      answers: t.answers,
      notes: t.notes,
    })
  }

  const field = (label: string, children: React.ReactNode, full?: boolean) => (
    <label className={`block space-y-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  )

  const inputClass = 'field-input'

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email…"
            className="field-input !rounded-2xl py-3 pl-10 pr-4 backdrop-blur-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="field-input !w-auto !rounded-2xl py-3"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="fresh">Fresh</option>
          <option value="end">End</option>
        </select>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Add test
        </button>
      </div>

      <div className="glass overflow-hidden rounded-[1.35rem]">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[1050px]">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Email</th>
                <th>LinkedIn</th>
                <th>Start</th>
                <th>Check by</th>
                <th>Status</th>
                <th>Result</th>
                <th>Answers</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="!py-16 text-center text-ink-muted">
                    No tests yet. After you start an assessment, add it here and set a check date.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const due = daysUntil(t.endTestDate)
                  const dueLabel =
                    t.status !== 'pending'
                      ? null
                      : due < 0
                        ? `${Math.abs(due)}d late`
                        : due === 0
                          ? 'today'
                          : `${due}d left`

                  return (
                    <tr
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => setAnswersOf(t)}
                    >
                      <td className="font-semibold text-ink">{t.profileName || '—'}</td>
                      <td className="text-ink-soft">{t.email || '—'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {t.linkedinUrl ? (
                          <a
                            href={t.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-accent transition hover:text-accent-deep"
                          >
                            Open
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="whitespace-nowrap text-ink-soft">
                        {formatDate(t.startTestDate)}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="text-ink-soft">{formatDate(t.endTestDate)}</div>
                        {dueLabel && (
                          <div
                            className={`mt-0.5 text-[11px] font-bold ${due <= 0 ? 'text-danger' : 'text-ink-muted'}`}
                          >
                            {dueLabel}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${statusStyles[t.status]}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            title="Mark passed"
                            onClick={() => setResult(t, 'pass')}
                            className={`rounded-xl p-1.5 transition ${
                              t.result === 'pass'
                                ? 'bg-ok-soft text-ok'
                                : 'text-ink-muted hover:bg-ok-soft hover:text-ok'
                            }`}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            type="button"
                            title="Mark failed"
                            onClick={() => setResult(t, 'fail')}
                            className={`rounded-xl p-1.5 transition ${
                              t.result === 'fail'
                                ? 'bg-danger-soft text-danger'
                                : 'text-ink-muted hover:bg-danger-soft hover:text-danger'
                            }`}
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2 py-1 text-xs font-medium text-ink-muted">
                          <FileText size={13} />
                          {t.answers.trim() ? 'View' : 'Empty'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="rounded-xl p-2 text-ink-muted transition hover:bg-surface hover:text-ink"
                            aria-label="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete test for “${t.profileName}”?`)) {
                                onDelete(t.id)
                              }
                            }}
                            className="rounded-xl p-2 text-ink-muted transition hover:bg-danger-soft hover:text-danger"
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit test' : 'Add test'} onClose={closeForm} wide>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {field(
              'Profile name',
              <input
                required
                className={inputClass}
                value={form.profileName}
                onChange={(e) => setForm({ ...form, profileName: e.target.value })}
              />,
            )}
            {field(
              'Email',
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />,
            )}
            {field(
              'LinkedIn URL',
              <input
                type="url"
                className={inputClass}
                value={form.linkedinUrl}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              />,
              true,
            )}
            {field(
              'Start test date',
              <input
                type="date"
                required
                className={inputClass}
                value={form.startTestDate}
                onChange={(e) => {
                  const start = e.target.value
                  setForm({
                    ...form,
                    startTestDate: start,
                    endTestDate: start ? addDays(start, waitDays) : form.endTestDate,
                  })
                }}
              />,
            )}
            {field(
              'Wait days (sets check date)',
              <select
                className={inputClass}
                value={waitDays}
                onChange={(e) => {
                  const days = Number(e.target.value)
                  setWaitDays(days)
                  if (form.startTestDate) {
                    setForm({
                      ...form,
                      endTestDate: addDays(form.startTestDate, days),
                    })
                  }
                }}
              >
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
                <option value={4}>4 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
              </select>,
            )}
            {field(
              'Check / end date',
              <input
                type="date"
                required
                className={inputClass}
                value={form.endTestDate}
                onChange={(e) => setForm({ ...form, endTestDate: e.target.value })}
              />,
            )}
            {field(
              'Status',
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TestStatus })
                }
              >
                <option value="pending">Pending</option>
                <option value="fresh">Fresh</option>
                <option value="end">End</option>
              </select>,
            )}
            {field(
              'Result',
              <select
                className={inputClass}
                value={form.result ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    result: (e.target.value || null) as TestResult,
                  })
                }
              >
                <option value="">Not set</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>,
            )}
            {field(
              'Test answers',
              <textarea
                rows={8}
                className={`${inputClass} font-mono text-[13px]`}
                placeholder="Paste or write the assessment answers here…"
                value={form.answers}
                onChange={(e) => setForm({ ...form, answers: e.target.value })}
              />,
              true,
            )}
            {field(
              'Notes',
              <textarea
                rows={2}
                className={inputClass}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />,
              true,
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={closeForm} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editing ? 'Save changes' : 'Add test'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {answersOf && (
        <Modal
          title={`Answers — ${answersOf.profileName || 'Test'}`}
          onClose={() => setAnswersOf(null)}
          wide
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold capitalize text-ink-soft">
              {answersOf.status}
            </span>
            <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold capitalize text-ink-soft">
              {answersOf.result ?? 'no result'}
            </span>
            <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted">
              {answersOf.email || 'No email'}
            </span>
          </div>
          <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-line bg-surface/80 p-5 font-mono text-[13px] leading-relaxed text-ink">
            {answersOf.answers.trim() || 'No answers recorded yet.'}
          </pre>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAnswersOf(null)
                openEdit(answersOf)
              }}
              className="btn-ghost"
            >
              Edit answers
            </button>
            <button type="button" onClick={() => setAnswersOf(null)} className="btn-primary">
              Close
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}
