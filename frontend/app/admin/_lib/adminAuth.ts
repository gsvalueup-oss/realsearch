export const ADMIN_PASSWORD_STORAGE_KEY = 'realsearch_admin_password'

export function readStoredAdminPassword() {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || ''
}

// TODO: Replace this temporary password storage with server-managed admin sessions.
export function storeAdminPassword(password: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password)
}

export function clearStoredAdminPassword() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY)
}
