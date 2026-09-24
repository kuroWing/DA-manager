import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type SortDir = 'asc' | 'desc'

export function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): number {
  const emptyA = a == null || a === ''
  const emptyB = b == null || b === ''
  if (emptyA && emptyB) return 0
  if (emptyA) return 1
  if (emptyB) return -1

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export function sortBy<T>(
  rows: T[],
  getValue: (row: T) => string | number | null | undefined,
  dir: SortDir,
): T[] {
  return [...rows].sort((a, b) => {
    const va = getValue(a)
    const vb = getValue(b)
    const emptyA = va == null || va === ''
    const emptyB = vb == null || vb === ''
    if (emptyA && emptyB) return 0
    if (emptyA) return 1
    if (emptyB) return -1
    const cmp = compareSortValues(va, vb)
    return dir === 'asc' ? cmp : -cmp
  })
}

interface SortableThProps<K extends string> {
  label: string
  column: K
  sortKey: K
  sortDir: SortDir
  onSort: (column: K) => void
  className?: string
}

export function SortableTh<K extends string>({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  className = '',
}: SortableThProps<K>) {
  const active = sortKey === column
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 -mx-1 transition hover:bg-surface hover:text-ink ${
          active ? 'text-ink' : 'text-inherit'
        }`}
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp size={13} className="text-accent" />
          ) : (
            <ArrowDown size={13} className="text-accent" />
          )
        ) : (
          <ArrowUpDown size={13} className="opacity-40" />
        )}
      </button>
    </th>
  )
}
