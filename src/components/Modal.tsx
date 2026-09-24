import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

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
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6"
      style={{ background: 'var(--modal-scrim)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`flex w-full flex-col overflow-hidden rounded-[1.35rem] border border-line-strong bg-panel-solid shadow-[0_24px_80px_-20px_rgba(0,0,0,0.45)] ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}
        style={{
          height: 'min(900px, calc(100vh - 1.5rem))',
          maxHeight: 'calc(100vh - 1.5rem)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-surface/60 px-5 py-4 sm:px-6">
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
        <div
          className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6"
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
