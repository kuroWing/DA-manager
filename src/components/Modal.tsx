import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 overflow-y-auto overflow-x-hidden overscroll-contain backdrop-blur-[6px]"
      style={{ background: 'var(--modal-scrim)' }}
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full justify-center p-3 sm:p-6">
        <div
          className={`animate-scale-in my-auto w-full rounded-[1.35rem] border border-line-strong bg-panel-solid shadow-[0_24px_80px_-20px_rgba(0,0,0,0.45)] ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[1.35rem] border-b border-line bg-panel-solid px-5 py-4 sm:px-6">
            <h2
              id="modal-title"
              className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-ink-muted transition hover:bg-surface hover:text-ink"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
