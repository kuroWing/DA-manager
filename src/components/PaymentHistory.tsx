import { Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDate, formatMoney } from '../storage'
import type { PaymentRecord } from '../types'
import { SortableTh, sortBy, type SortDir } from './SortableTh'

type PaymentSortKey = 'profileName' | 'anydeskId' | 'payDate' | 'amount'

const paymentSortGetters: Record<
  PaymentSortKey,
  (p: PaymentRecord) => string | number | null | undefined
> = {
  profileName: (p) => p.profileName,
  anydeskId: (p) => p.anydeskId,
  payDate: (p) => p.payDate,
  amount: (p) => p.amount,
}

interface PaymentHistoryProps {
  payments: PaymentRecord[]
  onDelete: (id: string) => void
}

export function PaymentHistory({ payments, onDelete }: PaymentHistoryProps) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<PaymentSortKey>('payDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = !q
      ? payments
      : payments.filter((p) =>
          [p.profileName, p.anydeskId, p.payDate, String(p.amount)]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
    return sortBy(rows, paymentSortGetters[sortKey], sortDir)
  }, [payments, query, sortKey, sortDir])

  const onSort = (column: PaymentSortKey) => {
    if (column === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(column)
      setSortDir(column === 'payDate' || column === 'amount' ? 'desc' : 'asc')
    }
  }

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
                <SortableTh
                  label="Profile name"
                  column="profileName"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="AnyDesk ID"
                  column="anydeskId"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Pay date"
                  column="payDate"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
                <SortableTh
                  label="Amount"
                  column="amount"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={onSort}
                />
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
