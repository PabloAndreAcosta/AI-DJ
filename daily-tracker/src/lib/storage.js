const STORAGE_KEY = 'daily-tracker-entries'

export function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveEntry(date, entry) {
  const all = loadEntries()
  all[date] = entry
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
