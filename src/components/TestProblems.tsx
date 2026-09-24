import { BookOpen, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { TestProblem, TestProblemInput } from '../types'

interface TestProblemsProps {
  problems: TestProblem[]
  onUpdate: (id: number, input: TestProblemInput) => void
}

export function TestProblems({ problems, onUpdate }: TestProblemsProps) {
  const [openId, setOpenId] = useState<number | null>(problems[0]?.id ?? 1)

  return (
    <section className="space-y-3">
      <div className="glass rounded-[1.35rem] px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-deep">
            <BookOpen size={16} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              Test problems
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Six assessment problem slots. Fill in titles and content — saved
              automatically with your other data.
            </p>
          </div>
        </div>
      </div>

      {problems.map((problem) => (
        <ProblemCard
          key={problem.id}
          problem={problem}
          open={openId === problem.id}
          onToggle={() =>
            setOpenId((current) => (current === problem.id ? null : problem.id))
          }
          onUpdate={onUpdate}
        />
      ))}
    </section>
  )
}

function ProblemCard({
  problem,
  open,
  onToggle,
  onUpdate,
}: {
  problem: TestProblem
  open: boolean
  onToggle: () => void
  onUpdate: (id: number, input: TestProblemInput) => void
}) {
  const [title, setTitle] = useState(problem.title)
  const [content, setContent] = useState(problem.content)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setTitle(problem.title)
    setContent(problem.content)
  }, [problem.id, problem.title, problem.content])

  useEffect(() => {
    if (title === problem.title && content === problem.content) return
    const timer = window.setTimeout(() => {
      onUpdate(problem.id, { title, content })
      setSavedFlash(true)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [title, content, problem.id, problem.title, problem.content, onUpdate])

  useEffect(() => {
    if (!savedFlash) return
    const timer = window.setTimeout(() => setSavedFlash(false), 1200)
    return () => window.clearTimeout(timer)
  }, [savedFlash])

  const filled = Boolean(problem.title.trim() || problem.content.trim())
  const preview =
    problem.title.trim() ||
    (problem.content.trim()
      ? problem.content.trim().slice(0, 80) +
        (problem.content.trim().length > 80 ? '…' : '')
      : 'Empty — click to add content')

  return (
    <div className="glass overflow-hidden rounded-[1.35rem]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-surface/50 sm:px-6"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-sm font-bold text-ink-soft">
          {problem.id}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              Problem {problem.id}
            </span>
            {filled && (
              <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-deep">
                Filled
              </span>
            )}
            {savedFlash && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok">
                <Check size={12} />
                Saved
              </span>
            )}
          </div>
          <div
            className={`mt-0.5 truncate text-sm ${
              filled ? 'font-semibold text-ink' : 'text-ink-muted'
            }`}
          >
            {preview}
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-ink-muted" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-ink-muted" />
        )}
      </button>

      {open && (
        <div className="space-y-4 border-t border-line px-5 py-5 sm:px-6">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              Title
            </span>
            <input
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Problem ${problem.id} title`}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              Content
            </span>
            <textarea
              rows={12}
              className="field-input font-mono text-[13px] leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or write the problem statement, prompts, constraints…"
            />
          </label>
        </div>
      )}
    </div>
  )
}
