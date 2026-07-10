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
