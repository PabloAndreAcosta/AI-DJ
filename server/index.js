import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { catalog, genreFamilies } from './catalog-data.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Du är en expert-DJ specialiserad på Kizomba-paraplyet av musikstilar. Du hjälper DJs att mixa och bygga setlists.

Du har kunskap om dessa genrer och deras BPM-ranges:
${Object.entries(genreFamilies).map(([name, info]) => `- ${name}: ${info.bpmRange[0]}-${info.bpmRange[1]} BPM, mixar bra med: ${info.transitionTo.join(', ')}`).join('\n')}

Du har tillgång till detta musikbibliotek:
${catalog.map(t => `[${t.id}] "${t.title}" av ${t.artist} — ${t.genre}, ${t.bpm} BPM, key: ${t.key}, energi: ${t.energy}/10`).join('\n')}

Regler:
- Svara alltid på svenska
- Vid setlist-förslag, returnera JSON i formatet: {"setlist": [id1, id2, ...], "explanation": "..."}
- Vid övergångsanalys, ge detaljerade tips om BPM, key (Camelot wheel), genre-kompatibilitet och energi
- Vid rekommendationer, motivera varje val
- Var koncis men informativ
- Använd musikalisk terminologi korrekt
- Om användaren frågar om något utanför DJ-kontexten, hänvisa tillbaka till mixning`

app.post('/api/chat', async (req, res) => {
  const { prompt, deckA, deckB, currentSetlist } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt krävs' })
  }

  let context = ''
  if (deckA) context += `\nDeck A: "${deckA.title}" av ${deckA.artist} (${deckA.genre}, ${deckA.bpm} BPM, ${deckA.key}, E:${deckA.energy})`
  if (deckB) context += `\nDeck B: "${deckB.title}" av ${deckB.artist} (${deckB.genre}, ${deckB.bpm} BPM, ${deckB.key}, E:${deckB.energy})`
  if (currentSetlist?.length > 0) {
    context += `\nAktuell setlist: ${currentSetlist.map((t, i) => `${i + 1}. ${t.title}`).join(', ')}`
  }

  const userMessage = context ? `${prompt}\n\nKontext:${context}` : prompt

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = message.content[0].text

    // Try to extract setlist IDs if present
    let setlistIds = null
    const jsonMatch = text.match(/\{"setlist":\s*\[[\d,\s]+\]/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0] + '}')
        setlistIds = parsed.setlist
      } catch {}
    }

    res.json({
      text: text.replace(/\{"setlist":\s*\[[\d,\s]+\],\s*"explanation":\s*"[^"]*"\}/g, '').trim(),
      setlistIds,
    })
  } catch (error) {
    console.error('Claude API error:', error.message)
    res.status(500).json({ error: 'AI-tjänsten är inte tillgänglig. Kontrollera din API-nyckel.' })
  }
})

// Spotify token exchange (for PKCE flow, the token exchange needs a server)
app.post('/api/spotify/token', async (req, res) => {
  const { code, codeVerifier, redirectUri } = req.body
  const clientId = process.env.SPOTIFY_CLIENT_ID

  if (!clientId) {
    return res.status(500).json({ error: 'Spotify client ID saknas' })
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      }),
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Spotify token error:', error.message)
    res.status(500).json({ error: 'Kunde inte hämta Spotify-token' })
  }
})

app.post('/api/spotify/refresh', async (req, res) => {
  const { refreshToken } = req.body
  const clientId = process.env.SPOTIFY_CLIENT_ID

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte förnya token' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🎛 Kizomba AI DJ server running on port ${PORT}`)
})
