import { Bell, CheckCircle2 } from 'lucide-react'
import type { TestRecord } from '../types'
import { daysUntil, formatDate } from '../storage'

interface AlertBannerProps {
  dueTests: TestRecord[]
  onOpenTest: (id: string) => void
  dismissed: Set<string>
  onDismiss: (id: string) => void
}

export function AlertBanner({
  dueTests,
  onOpenTest,
  dismissed,
  onDismiss,
}: AlertBannerProps) {
  const visible = dueTests.filter((t) => !dismissed.has(t.id))
  if (visible.length === 0) return null

  return (
    <div className="mb-5 space-y-2">
      {visible.map((t, i) => {
        const days = daysUntil(t.endTestDate)
        const label =
          days < 0
            ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
            : days === 0
              ? 'due today'
              : `due in ${days} day${days === 1 ? '' : 's'}`

        return (
          <div
            key={t.id}
            className="animate-slide-in flex flex-wrap items-center gap-3 rounded-2xl border border-orange-300/50 bg-warn-soft px-4 py-3.5 text-sm text-warn dark:border-orange-400/25"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-panel-solid/70">
              <Bell size={16} />
            </span>
            <p className="min-w-0 flex-1 leading-snug">
              <span className="font-semibold text-ink">{t.profileName || 'Unnamed profile'}</span>
              <span className="text-warn/90"> — test check {label}</span>
              <span className="ml-1 text-warn/70">({formatDate(t.endTestDate)})</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenTest(t.id)}
                className="rounded-xl bg-warn px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110 dark:text-ink"
              >
                Open test
              </button>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-warn/80 transition hover:bg-panel-solid/60"
                title="Dismiss for this session"
              >
                <CheckCircle2 size={14} />
                Dismiss
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
