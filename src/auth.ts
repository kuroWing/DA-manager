const SESSION_KEY = 'da-manager-auth'

export const ADMIN = {
  id: 'kaka',
  password: '123456',
} as const

export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === ADMIN.id
  } catch {
    return false
  }
}

export function login(id: string, password: string): boolean {
  const ok =
    id.trim().toLowerCase() === ADMIN.id && password === ADMIN.password
  if (ok) {
    localStorage.setItem(SESSION_KEY, ADMIN.id)
  }
  return ok
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}
