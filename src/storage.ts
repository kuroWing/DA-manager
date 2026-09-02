import type { AppData, PaymentMethod, PaymentRecord, Profile, TestRecord } from './types'

const STORAGE_KEY = 'da-manager-data-v1'

const emptyData = (): AppData => ({ profiles: [], tests: [], payments: [] })

function normalizeProfile(p: Profile): Profile {
  const paymentDate =
    p.paymentDate ||
    (p.rentStartDate ? calcNextPayDate(p.rentStartDate, p.paymentMethod || 'weekly') : '')
  return {
    ...p,
    paymentMethod: p.paymentMethod === 'monthly' ? 'monthly' : 'weekly',
    paymentAmount: Number(p.paymentAmount) || 0,
    paymentDate,
    notes: p.notes ?? '',
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      profiles: Array.isArray(parsed.profiles)
        ? parsed.profiles.map((p) => normalizeProfile(p as Profile))
        : [],
      tests: Array.isArray(parsed.tests) ? (parsed.tests as TestRecord[]) : [],
      payments: Array.isArray(parsed.payments)
        ? (parsed.payments as PaymentRecord[])
        : [],
    }
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

export function importData(json: string): AppData {
  const parsed = JSON.parse(json) as Partial<AppData>
  if (!Array.isArray(parsed.profiles) || !Array.isArray(parsed.tests)) {
    throw new Error('Invalid backup file')
  }
  return {
    profiles: (parsed.profiles as Profile[]).map(normalizeProfile),
    tests: parsed.tests as TestRecord[],
    payments: Array.isArray(parsed.payments)
      ? (parsed.payments as PaymentRecord[])
      : [],
  }
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function isDueOrOverdue(dateStr: string): boolean {
  return daysUntil(dateStr) <= 0
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatMoney(amount: number): string {
  if (amount === 0 || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() < day) {
    d.setDate(0)
  }
  return toISODate(d)
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function advancePayDate(dateStr: string, method: PaymentMethod): string {
  return method === 'weekly' ? addDays(dateStr, 7) : addMonths(dateStr, 1)
}

/** First pay date on the schedule that is on or after `fromDate` (default today). */
export function calcNextPayDate(
  startDate: string,
  method: PaymentMethod,
  fromDate: string = todayISO(),
): string {
  if (!startDate) return ''
  let d = startDate
  if (d >= fromDate) return d
  let guard = 0
  while (d < fromDate && guard < 2000) {
    d = advancePayDate(d, method)
    guard++
  }
  return d
}

export function resolveProfilePayDate(
  input: Pick<Profile, 'rentStartDate' | 'paymentMethod' | 'paymentDate'>,
  existing?: Profile | null,
): string {
  if (!input.rentStartDate) return ''
  if (
    existing &&
    existing.rentStartDate === input.rentStartDate &&
    existing.paymentMethod === input.paymentMethod &&
    existing.paymentDate
  ) {
    return existing.paymentDate
  }
  return calcNextPayDate(input.rentStartDate, input.paymentMethod)
}
