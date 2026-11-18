import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'


export interface StoredAuth {
  userName: string
  expiresAtUtc: string
}

interface AuthState {
  userName: string | null
  isLoggedIn: boolean
  login: (auth: StoredAuth) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export const AUTH_STORAGE_KEY = 'dairy.auth'

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (new Date(parsed.expiresAtUtc).getTime() <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(readStoredAuth)

  const value = useMemo<AuthState>(
    () => ({
      userName: auth?.userName ?? null,
      isLoggedIn: !!auth?.userName,
      login: (next: StoredAuth) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
        setAuth(next)
      },
      logout: async () => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        setAuth(null)
        // Best-effort: clears the server-side auth cookie. Client state is
        // already cleared above regardless of whether this call succeeds.
        await authApi.logout().catch(() => {})
      },
    }),
    [auth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
