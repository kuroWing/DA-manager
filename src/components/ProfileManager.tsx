import { Eye, EyeOff, ExternalLink, Pencil, Plus, Search, Trash2, ClipboardPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  addDays,
  calcNextPayDate,
  daysUntil,
  formatDate,
  formatMoney,
  resolveProfilePayDate,
  todayISO,
} from '../storage'
import type { Profile, ProfileInput, TestInput, TestRecord } from '../types'
import { Modal } from './Modal'
import { SortableTh, sortBy, type SortDir } from './SortableTh'

type ProfileSortKey =
  | 'country'
  | 'name'
  | 'linkedin'
  | 'anydeskId'
  | 'password'
  | 'rentStartDate'
  | 'payment'
  | 'paymentDate'

const profileSortGetters: Record<
  ProfileSortKey,
  (p: Profile) => string | number | null | undefined
> = {
  country: (p) => p.country,
  name: (p) => p.name,
  linkedin: (p) => p.linkedinUrl,
  anydeskId: (p) => p.anydeskId,
  password: (p) => p.password,
  rentStartDate: (p) => p.rentStartDate,
  payment: (p) => p.paymentAmount,
  paymentDate: (p) => p.paymentDate,
}

const emptyForm = (): ProfileInput => ({
  country: '',
  name: '',
  linkedinUrl: '',
  anydeskId: '',
  password: '',
  rentStartDate: '',
  paymentMethod: 'weekly',
  paymentAmount: 0,
  paymentDate: '',
  notes: '',
})

interface ProfileManagerProps {
  profiles: Profile[]
  tests: TestRecord[]
  onAdd: (input: ProfileInput) => void
  onUpdate: (id: string, input: ProfileInput) => void
  onDelete: (id: string) => void
  onSendToTodayTests: (inputs: TestInput[]) => void
}

function findPendingTest(profile: Profile, tests: TestRecord[]): TestRecord | undefined {
  const pending = tests.filter((t) => t.status === 'pending')
  const linkedin = profile.linkedinUrl.trim().toLowerCase()
  if (linkedin) {
    const byLinkedIn = pending.find(
      (t) => t.linkedinUrl.trim().toLowerCase() === linkedin,
    )
    if (byLinkedIn) return byLinkedIn
  }
  const name = profile.name.trim().toLowerCase()
  if (!name) return undefined
  return pending.find((t) => t.profileName.trim().toLowerCase() === name)
}

function profileToTodayTest(p: Profile): TestInput {
  const start = todayISO()
  return {
    profileName: p.name.trim() || p.country.trim() || 'Unnamed',
    linkedinUrl: p.linkedinUrl,
    email: '',
    startTestDate: start,
    endTestDate: addDays(start, 3),
    status: 'pending',
    result: null,
    answers: '',
    notes: '',
  }
}

export function ProfileManager({
  profiles,
  tests,
  onAdd,
  onUpdate,
  onDelete,
  onSendToTodayTests,
}: ProfileManagerProps) {
  const [query, setQuery] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<ProfileInput>(emptyForm())
  const [sortKey, setSortKey] = useState<ProfileSortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const pendingByProfileId = useMemo(() => {
    const map = new Map<string, TestRecord>()
    for (const p of profiles) {
      const pending = findPendingTest(p, tests)
      if (pending) map.set(p.id, pending)
    }
    return map
  }, [profiles, tests])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = !q
      ? profiles
      : profiles.filter((p) =>
          [p.country, p.name, p.anydeskId, p.linkedinUrl, p.notes]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
    return sortBy(rows, profileSortGetters[sortKey], sortDir)
  }, [profiles, query, sortKey, sortDir])

  const onSort = (column: ProfileSortKey) => {
    if (column === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(column)
      setSortDir('asc')
    }
  }

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered])
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id))
  const someFilteredSelected = filteredIds.some((id) => selected.has(id))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id)
      } else {
        for (const id of filteredIds) next.add(id)
      }
      return next
    })
  }

  const sendSelectedToTodayTests = () => {
    const chosen = profiles.filter((p) => selected.has(p.id))
    if (chosen.length === 0) return

    const fresh = chosen.filter((p) => !pendingByProfileId.has(p.id))
    const skipped = chosen.length - fresh.length

    if (fresh.length === 0) {
      alert(
        'All selected profiles already have a pending test. Nothing was added.',
      )
      return
    }

    const message =
      skipped > 0
        ? `Add ${fresh.length} profile${fresh.length === 1 ? '' : 's'} to today’s tests? (${skipped} already pending will be skipped.) Check date defaults to 3 days from today.`
        : `Add ${fresh.length} profile${fresh.length === 1 ? '' : 's'} to today’s tests? Check date defaults to 3 days from today.`

    if (!confirm(message)) return

    onSendToTodayTests(fresh.map(profileToTodayTest))
    setSelected(new Set())
  }

  const openCreate = () => {
    setForm(emptyForm())
    setCreating(true)
    setEditing(null)
  }

  const openEdit = (p: Profile) => {
    setForm({
      country: p.country,
      name: p.name,
      linkedinUrl: p.linkedinUrl,
      anydeskId: p.anydeskId,
      password: p.password,
      rentStartDate: p.rentStartDate,
      paymentMethod: p.paymentMethod,
      paymentAmount: p.paymentAmount,
      paymentDate: p.paymentDate,
      notes: p.notes,
    })
    setEditing(p)
    setCreating(false)
  }

  const closeForm = () => {
    setCreating(false)
    setEditing(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const paymentDate = resolveProfilePayDate(form, editing)
    const payload = { ...form, paymentDate }
    if (editing) onUpdate(editing.id, payload)
    else onAdd(payload)
    closeForm()
  }

  const previewPayDate = useMemo(() => {
    if (!form.rentStartDate) return ''
    if (
      editing &&
      editing.rentStartDate === form.rentStartDate &&
      editing.paymentMethod === form.paymentMethod &&
      editing.paymentDate
    ) {
      return editing.paymentDate
    }
    return calcNextPayDate(form.rentStartDate, form.paymentMethod)
  }, [form.rentStartDate, form.paymentMethod, editing])

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const field = (
    label: string,
    children: React.ReactNode,
    full?: boolean,
  ) => (
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
            placeholder="Search country, name, AnyDesk…"
            className="field-input !rounded-2xl py-3 pl-10 pr-4 backdrop-blur-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className="btn-ghost"
        >
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPasswords ? 'Hide passwords' : 'Show passwords'}
        </button>
        <button
          type="button"
          onClick={sendSelectedToTodayTests}
          disabled={selected.size === 0}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ClipboardPlus size={16} />
          Today’s tests
          {selected.size > 0 ? ` (${selected.size})` : ''}
        </button>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Add profile
        </button>
      </div>

      {pendingByProfileId.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-warn-soft px-2.5 py-1 font-semibold text-warn">
            <span className="h-1.5 w-1.5 rounded-sm bg-warn" />
            Pending test
          </span>
          <span>
            {pendingByProfileId.size} profile
            {pendingByProfileId.size === 1 ? '' : 's'} with a pending test (orange).
            Payment due stays teal.
          </span>
        </div>
      )}

      <div className="glass overflow-hidden rounded-[1.35rem]">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected
                    }}
                    onChange={toggleSelectAllFiltered}
                    disabled={filtered.length === 0}
                    aria-label="Select all visible profiles"
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </th>
                <SortableTh label="Country" column="country" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTh label="Name" column="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTh label="LinkedIn" column="linkedin" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTh label="AnyDesk ID" column="anydeskId" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTh label="Password" column="password" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTh label="Rent start" column="rentStartDate" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTh label="Payment" column="payment" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortableTh label="Next pay" column="paymentDate" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="!py-16 text-center text-ink-muted">
                    No profiles yet. Add your first laptop profile to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const visible = showPasswords || revealed.has(p.id)
                  const pendingTest = pendingByProfileId.get(p.id)
                  const isSelected = selected.has(p.id)
                  const testDue = pendingTest
                    ? daysUntil(pendingTest.endTestDate)
                    : null
                  const testDueLabel =
                    testDue == null
                      ? null
                      : testDue < 0
                        ? `${Math.abs(testDue)}d late`
                        : testDue === 0
                          ? 'check today'
                          : `${testDue}d left`

                  return (
                    <tr
                      key={p.id}
                      className={
                        pendingTest
                          ? '[&>td]:bg-warn-soft/80 dark:[&>td]:bg-warn-soft/35'
                          : isSelected
                            ? '[&>td]:bg-accent-soft/50'
                            : undefined
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          aria-label={`Select ${p.name || p.country || 'profile'}`}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                      </td>
                      <td>
                        <span className="inline-flex rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-ink-soft">
                          {p.country || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-ink">{p.name || '—'}</div>
                        {pendingTest && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex rounded-md bg-warn px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Pending test
                            </span>
                            {testDueLabel && (
                              <span
                                className={`text-[11px] font-bold ${
                                  testDue != null && testDue <= 0
                                    ? 'text-danger'
                                    : 'text-warn'
                                }`}
                              >
                                {testDueLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {p.linkedinUrl ? (
                          <a
                            href={p.linkedinUrl}
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
                      <td className="font-mono text-[13px] tracking-tight text-ink-soft">
                        {p.anydeskId || '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px]">
                            {p.password
                              ? visible
                                ? p.password
                                : '••••••••'
                              : '—'}
                          </span>
                          {p.password && !showPasswords && (
                            <button
                              type="button"
                              onClick={() => toggleReveal(p.id)}
                              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
                              aria-label={visible ? 'Hide password' : 'Show password'}
                            >
                              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-ink-soft">
                        {formatDate(p.rentStartDate)}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="capitalize text-ink-soft">{p.paymentMethod}</span>
                        <span className="mx-1 text-line-strong">·</span>
                        <span className="font-semibold">{formatMoney(p.paymentAmount)}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="text-ink-soft">{formatDate(p.paymentDate)}</div>
                        {p.paymentDate && daysUntil(p.paymentDate) <= 0 && (
                          <div className="mt-0.5 text-[11px] font-bold text-accent">
                            Due — confirm paid
                          </div>
                        )}
                        {p.paymentDate &&
                          daysUntil(p.paymentDate) > 0 &&
                          daysUntil(p.paymentDate) <= 3 && (
                            <div className="mt-0.5 text-[11px] font-bold text-ink-muted">
                              in {daysUntil(p.paymentDate)}d
                            </div>
                          )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="rounded-xl p-2 text-ink-muted transition hover:bg-surface hover:text-ink"
                            aria-label="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete profile “${p.name || p.country}”?`)) {
                                onDelete(p.id)
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
        <Modal
          title={editing ? 'Edit profile' : 'Add profile'}
          onClose={closeForm}
          wide
        >
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {field(
              'Country',
              <input
                required
                className={inputClass}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />,
            )}
            {field(
              'Name',
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />,
            )}
            {field(
              'LinkedIn URL',
              <input
                type="url"
                className={inputClass}
                placeholder="https://www.linkedin.com/in/…"
                value={form.linkedinUrl}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              />,
              true,
            )}
            {field(
              'AnyDesk ID',
              <input
                className={inputClass}
                value={form.anydeskId}
                onChange={(e) => setForm({ ...form, anydeskId: e.target.value })}
              />,
            )}
            {field(
              'Password',
              <input
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />,
            )}
            {field(
              'Rent start date',
              <input
                type="date"
                required
                className={inputClass}
                value={form.rentStartDate}
                onChange={(e) => setForm({ ...form, rentStartDate: e.target.value })}
              />,
            )}
            {field(
              'Payment method',
              <select
                className={inputClass}
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentMethod: e.target.value as ProfileInput['paymentMethod'],
                  })
                }
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>,
            )}
            {field(
              'Payment amount (USD)',
              <input
                type="number"
                min={0}
                step={1}
                className={inputClass}
                value={form.paymentAmount || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentAmount: Number(e.target.value) || 0,
                  })
                }
              />,
            )}
            <div className="rounded-xl border border-line bg-surface/70 px-3 py-3 text-sm sm:col-span-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Next pay date (auto)
              </div>
              <div className="mt-1 font-semibold text-ink">
                {previewPayDate
                  ? `${formatDate(previewPayDate)} · ${form.paymentMethod}`
                  : 'Set a rent start date to calculate'}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Calculated from start date + weekly/monthly. When due, you will be asked if you paid.
              </p>
            </div>
            {field(
              'Notes',
              <textarea
                rows={3}
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
                {editing ? 'Save changes' : 'Add profile'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
