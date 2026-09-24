import { Eye, EyeOff, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  calcNextPayDate,
  daysUntil,
  formatDate,
  formatMoney,
  resolveProfilePayDate,
} from '../storage'
import type { Profile, ProfileInput } from '../types'
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
  onAdd: (input: ProfileInput) => void
  onUpdate: (id: string, input: ProfileInput) => void
  onDelete: (id: string) => void
}

export function ProfileManager({
  profiles,
  onAdd,
  onUpdate,
  onDelete,
}: ProfileManagerProps) {
  const [query, setQuery] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<ProfileInput>(emptyForm())
  const [sortKey, setSortKey] = useState<ProfileSortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

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
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Add profile
        </button>
      </div>

      <div className="glass overflow-hidden rounded-[1.35rem]">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
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
                  <td colSpan={9} className="!py-16 text-center text-ink-muted">
                    No profiles yet. Add your first laptop profile to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const visible = showPasswords || revealed.has(p.id)
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="inline-flex rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-ink-soft">
                          {p.country || '—'}
                        </span>
                      </td>
                      <td className="font-semibold text-ink">{p.name || '—'}</td>
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
                        {p.paymentDate && daysUntil(p.paymentDate) > 0 && daysUntil(p.paymentDate) <= 3 && (
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
