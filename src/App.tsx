import {
  Download,
  Laptop,
  ClipboardList,
  History,
  LogOut,
  Moon,
  Sun,
  Upload,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { isLoggedIn, logout } from './auth'
import { AlertBanner } from './components/AlertBanner'
import { LoginPage } from './components/LoginPage'
import { PaymentAlertBanner } from './components/PaymentAlertBanner'
import { PaymentHistory } from './components/PaymentHistory'
import { ProfileManager } from './components/ProfileManager'
import { TestManager } from './components/TestManager'
import { useStore } from './hooks/useStore'
import { useTheme } from './hooks/useTheme'
import { exportData, importData } from './storage'

type Tab = 'profiles' | 'tests' | 'payments'

export default function App() {
  const [authed, setAuthed] = useState(() => isLoggedIn())
  const { theme, toggleTheme } = useTheme()

  if (!authed) {
    return (
      <LoginPage
        onSuccess={() => setAuthed(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <Dashboard
      theme={theme}
      toggleTheme={toggleTheme}
      onLogout={() => {
        logout()
        setAuthed(false)
      }}
    />
  )
}

function Dashboard({
  theme,
  toggleTheme,
  onLogout,
}: {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onLogout: () => void
}) {
  const {
    data,
    replaceAll,
    addProfile,
    updateProfile,
    deleteProfile,
    markProfilePaid,
    deletePayment,
    addTest,
    updateTest,
    deleteTest,
    dueTests,
    duePayments,
  } = useStore()

  const [tab, setTab] = useState<Tab>('profiles')
  const [dismissedTests, setDismissedTests] = useState<Set<string>>(new Set())
  const [dismissedPayments, setDismissedPayments] = useState<Set<string>>(new Set())
  const [focusTestId, setFocusTestId] = useState<string | null>(null)

  const dismissTestAlert = useCallback((id: string) => {
    setDismissedTests((prev) => new Set(prev).add(id))
  }, [])

  const dismissPaymentAlert = useCallback((id: string) => {
    setDismissedPayments((prev) => new Set(prev).add(id))
  }, [])

  const openDueTest = useCallback((id: string) => {
    setTab('tests')
    setFocusTestId(id)
  }, [])

  const handlePaid = useCallback(
    (profileId: string) => {
      markProfilePaid(profileId)
      setDismissedPayments((prev) => {
        const next = new Set(prev)
        next.delete(profileId)
        return next
      })
      setTab('payments')
    },
    [markProfilePaid],
  )

  const handleExport = () => {
    const blob = new Blob([exportData(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `da-manager-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const next = importData(text)
        if (
          confirm(
            `Import ${next.profiles.length} profiles, ${next.tests.length} tests, and ${next.payments.length} payments? This replaces current data.`,
          )
        ) {
          replaceAll(next)
        }
      } catch {
        alert('Could not import that file. Make sure it is a valid DA Manager backup.')
      }
    }
    input.click()
  }

  const pendingTests = data.tests.filter((t) => t.status === 'pending').length
  const alertCount = dueTests.length + duePayments.length

  return (
    <div className="mx-auto min-h-screen max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <header className="animate-fade-up glass mb-6 overflow-hidden rounded-[1.5rem] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-accent-soft/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-accent-deep">
              <span className="h-1.5 w-1.5 rounded-sm bg-accent" />
              DataAnnotation ops
            </div>
            <h1 className="font-display text-[2rem] font-bold leading-none tracking-tight text-ink sm:text-[2.6rem]">
              DA Manager
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
              Laptops, profiles, payments, and test wait times — one calm workspace.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="btn-ghost"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                <span className="hidden sm:inline">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </button>
              <button type="button" onClick={handleImport} className="btn-ghost">
                <Upload size={15} />
                Import
              </button>
              <button type="button" onClick={handleExport} className="btn-ghost">
                <Download size={15} />
                Export
              </button>
              <button type="button" onClick={onLogout} className="btn-ghost" title="Sign out">
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
            <div className="flex gap-2 text-center">
              <Stat label="Profiles" value={data.profiles.length} />
              <Stat label="Pending" value={pendingTests} />
              <Stat label="Due" value={alertCount} accent={alertCount > 0} />
            </div>
          </div>
        </div>
      </header>

      <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <PaymentAlertBanner
          dueProfiles={duePayments}
          dismissed={dismissedPayments}
          onPaid={handlePaid}
          onDismiss={dismissPaymentAlert}
        />
        <AlertBanner
          dueTests={dueTests}
          onOpenTest={openDueTest}
          dismissed={dismissedTests}
          onDismiss={dismissTestAlert}
        />
      </div>

      <div
        className="animate-fade-up mb-5 inline-flex flex-wrap rounded-2xl border border-line p-1.5 backdrop-blur-md"
        style={{ animationDelay: '120ms', background: 'var(--tab-rail)' }}
      >
        <TabButton
          active={tab === 'profiles'}
          onClick={() => setTab('profiles')}
          icon={<Laptop size={16} />}
          label="Laptops & profiles"
          count={data.profiles.length}
          badge={duePayments.length > 0 ? duePayments.length : undefined}
        />
        <TabButton
          active={tab === 'tests'}
          onClick={() => setTab('tests')}
          icon={<ClipboardList size={16} />}
          label="Test manager"
          count={data.tests.length}
          badge={dueTests.length > 0 ? dueTests.length : undefined}
        />
        <TabButton
          active={tab === 'payments'}
          onClick={() => setTab('payments')}
          icon={<History size={16} />}
          label="Payment history"
          count={data.payments.length}
        />
      </div>

      <div key={tab} className="animate-fade-up" style={{ animationDelay: '40ms' }}>
        {tab === 'profiles' ? (
          <ProfileManager
            profiles={data.profiles}
            onAdd={addProfile}
            onUpdate={updateProfile}
            onDelete={deleteProfile}
          />
        ) : tab === 'tests' ? (
          <TestManager
            tests={data.tests}
            onAdd={addTest}
            onUpdate={updateTest}
            onDelete={deleteTest}
            focusId={focusTestId}
            onFocusHandled={() => setFocusTestId(null)}
          />
        ) : (
          <PaymentHistory payments={data.payments} onDelete={deletePayment} />
        )}
      </div>

      <footer className="mt-8 px-1 text-xs text-ink-muted/80">
        Signed in as kaka · Stored locally in this browser.
      </footer>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div
      className={`min-w-[72px] rounded-xl border px-3 py-2 ${
        accent
          ? 'border-orange-300/40 bg-warn-soft text-warn dark:border-orange-400/30'
          : 'border-line text-ink'
      }`}
      style={accent ? undefined : { background: 'var(--stat-bg)' }}
    >
      <div className="font-display text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-ink text-panel-solid shadow-sm dark:text-canvas'
          : 'text-ink-muted hover:bg-surface hover:text-ink'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
      <span
        className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
          active ? 'bg-white/20 text-inherit' : 'bg-surface text-ink-muted'
        }`}
      >
        {count}
      </span>
      {badge != null && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-warn px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
