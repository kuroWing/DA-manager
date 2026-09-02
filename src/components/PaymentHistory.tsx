import { Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDate, formatMoney } from '../storage'
import type { PaymentRecord } from '../types'

interface PaymentHistoryProps {
  payments: PaymentRecord[]
  onDelete: (id: string) => void
}

export function PaymentHistory({ payments, onDelete }: PaymentHistoryProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return payments
    return payments.filter((p) =>
      [p.profileName, p.anydeskId, p.payDate, String(p.amount)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [payments, query])

  const total = useMemo(
    () => filtered.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [filtered],
  )

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
            placeholder="Search name, AnyDesk, date…"
            className="field-input !rounded-2xl py-3 pl-10 pr-4 backdrop-blur-sm"
          />
        </div>
        <div className="rounded-2xl border border-line px-4 py-2.5 text-sm">
          <span className="text-ink-muted">Total shown </span>
          <span className="font-semibold text-ink">{formatMoney(total)}</span>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-[1.35rem]">
        <div className="overflow-x-auto">
          <table className="data-table !min-w-[720px]">
            <thead>
              <tr>
                <th>Profile name</th>
                <th>AnyDesk ID</th>
                <th>Pay date</th>
                <th>Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="!py-16 text-center text-ink-muted">
                    No payment records yet. When a pay date is due, confirm “Yes, paid” to
                    add it here.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold text-ink">{p.profileName || '—'}</td>
                    <td className="font-mono text-[13px] text-ink-soft">
                      {p.anydeskId || '—'}
                    </td>
                    <td className="whitespace-nowrap text-ink-soft">
                      {formatDate(p.payDate)}
                    </td>
                    <td className="font-semibold">{formatMoney(p.amount)}</td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this payment record?')) onDelete(p.id)
                          }}
                          className="rounded-xl p-2 text-ink-muted transition hover:bg-danger-soft hover:text-danger"
                          aria-label="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
