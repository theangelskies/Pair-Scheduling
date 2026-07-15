import type { NavigateFn } from '@tanstack/react-router'
import api from './api'

export type Role = 'trainee' | 'volunteer' | 'admin'

export type AppUser = {
  id: number
  name: string
  email?: string
  role: Role
}

export type OnboardingResponse = {
  needsOnboarding: true
  email?: string
}

export function isOnboardingResponse(
  value: unknown
): value is OnboardingResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'needsOnboarding' in value &&
    (value as { needsOnboarding?: unknown }).needsOnboarding === true
  )
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('currentUser')
    return raw ? (JSON.parse(raw) as AppUser) : null
  } catch {
    return null
  }
}

export function saveCurrentUser(user: AppUser) {
  localStorage.setItem('currentUser', JSON.stringify(user))
  window.dispatchEvent(new CustomEvent('currentUserChanged'))
}

export async function loadCurrentUser(email?: string | null) {
  const data = await api.getUsers()

  if (isOnboardingResponse(data)) {
    return data
  }

  if (!Array.isArray(data)) {
    return {
      needsOnboarding: true,
      email: email ?? undefined,
    }
  }

  const user =
    data.find(
      (candidate: AppUser) => candidate.email === email
    ) ?? null

  if (!user) {
    return {
      needsOnboarding: true,
      email: email ?? undefined,
    }
  }

  saveCurrentUser(user)
  return user
}

/**
 * Redirect normal users after login.
 * Administrators are handled separately in auth/callback.tsx,
 * so this function only deals with trainee and volunteer.
 */
export function goToRoleHome(
  navigate: NavigateFn,
  role: string
) {
  if (role === 'volunteer') {
    void navigate({ to: '/volunteer' })
    return
  }

  void navigate({ to: '/trainee' })
}

/**
 * Google OAuth cannot attach custom metadata to the login request.
 * Store the selected role temporarily before redirecting to Google.
 */
const PENDING_ROLE_KEY = 'pendingRole'

export function savePendingRole(role: Role) {
  localStorage.setItem(PENDING_ROLE_KEY, role)
}

export function consumePendingRole(): Role | null {
  const role = localStorage.getItem(PENDING_ROLE_KEY)

  localStorage.removeItem(PENDING_ROLE_KEY)

  if (
    role === 'trainee' ||
    role === 'volunteer' ||
    role === 'admin'
  ) {
    return role
  }

  return null
}