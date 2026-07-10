import type { NavigateFn } from '@tanstack/react-router'
import api from './api'

export type AppUser = {
  id: number
  name: string
  email?: string
  role: string
}

export type OnboardingResponse = {
  needsOnboarding: true
  email?: string
}

export function isOnboardingResponse(value: unknown): value is OnboardingResponse {
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

  if (isOnboardingResponse(data)) return data
  if (!Array.isArray(data)) return { needsOnboarding: true, email: email ?? undefined }

  const user = data.find((candidate: AppUser) => candidate.email === email) ?? null
  if (!user) return { needsOnboarding: true, email: email ?? undefined }

  saveCurrentUser(user)
  return user
}

export function goToRoleHome(navigate: NavigateFn, role: string) {
  void navigate({ to: role === 'volunteer' ? '/volunteer' : '/trainee' })
}

// Google OAuth (unlike magic-link OTP) has no way to attach custom metadata
// to the sign-in request, so the role chosen on the login page rides along
// in localStorage across the redirect to Google and back instead.
const PENDING_ROLE_KEY = 'pendingRole'

export function savePendingRole(role: 'trainee' | 'volunteer') {
  localStorage.setItem(PENDING_ROLE_KEY, role)
}

export function consumePendingRole(): 'trainee' | 'volunteer' | null {
  const role = localStorage.getItem(PENDING_ROLE_KEY)
  localStorage.removeItem(PENDING_ROLE_KEY)
  return role === 'trainee' || role === 'volunteer' ? role : null
}
