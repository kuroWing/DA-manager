import { Banknote, CheckCircle2, X } from 'lucide-react'
import type { Profile } from '../types'
import { daysUntil, formatDate, formatMoney } from '../storage'

interface PaymentAlertBannerProps {
  dueProfiles: Profile[]
  dismissed: Set<string>
  onPaid: (profileId: string) => void
  onDismiss: (profileId: string) => void
}

export function PaymentAlertBanner({
  dueProfiles,
  dismissed,
  onPaid,
  onDismiss,
}: PaymentAlertBannerProps) {
  const visible = dueProfiles.filter((p) => !dismissed.has(p.id))
  if (visible.length === 0) return null

  return (
    <div className="mb-5 space-y-2">
      {visible.map((p, i) => {
        const days = daysUntil(p.paymentDate)
        const when =
          days < 0
            ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
            : 'due today'

        return (
          <div
            key={p.id}
            className="animate-slide-in flex flex-wrap items-center gap-3 rounded-2xl border border-teal-300/40 bg-accent-soft px-4 py-3.5 text-sm text-accent-deep dark:border-teal-400/25 dark:text-accent"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-panel-solid/70">
              <Banknote size={16} />
            </span>
            <p className="min-w-0 flex-1 leading-snug">
              <span className="font-semibold text-ink">
                {p.name || p.country || 'Unnamed profile'}
              </span>
              <span>
                {' '}
                — rent payment {when} ({formatDate(p.paymentDate)})
                {p.paymentAmount > 0 ? ` · ${formatMoney(p.paymentAmount)}` : ''}
              </span>
              <span className="mt-0.5 block text-ink-muted">Did you pay?</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPaid(p.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110 dark:text-canvas"
              >
                <CheckCircle2 size={14} />
                Yes, paid
              </button>
              <button
                type="button"
                onClick={() => onDismiss(p.id)}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-ink-muted transition hover:bg-panel-solid/60"
                title="Ask again later this session"
              >
                <X size={14} />
                Not yet
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
