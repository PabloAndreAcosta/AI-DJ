const API_BASE = import.meta.env.VITE_API_URL || ''

export async function chatWithClaude(prompt, deckA, deckB, currentSetlist) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, deckA, deckB, currentSetlist }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Nätverksfel' }))
    throw new Error(error.error || 'Kunde inte nå AI-servern')
  }

  return response.json()
}
