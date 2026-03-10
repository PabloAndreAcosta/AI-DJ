export const catalog = [
  { id: 1, title: 'Tarraxinha Dreams', artist: 'DJ Manya', bpm: 92, key: 'Am', energy: 4, genre: 'Kizomba' },
  { id: 2, title: 'Ghetto Zouk Vibes', artist: 'Nelson Freitas', bpm: 96, key: 'Cm', energy: 6, genre: 'Ghetto Zouk' },
  { id: 3, title: 'Nha Baby', artist: 'Mika Mendes', bpm: 94, key: 'F', energy: 5, genre: 'Kizomba' },
  { id: 4, title: 'Dança Ma Mi Criola', artist: 'Suzanna Lubrano', bpm: 98, key: 'Dm', energy: 7, genre: 'Kizomba' },
  { id: 5, title: 'Bo Tem Mel', artist: 'Neuza', bpm: 90, key: 'G', energy: 3, genre: 'Kizomba' },
  { id: 6, title: 'African Queen', artist: 'DJ Maphorisa', bpm: 105, key: 'Em', energy: 8, genre: 'Afrobeats' },
  { id: 7, title: 'Semba Feelings', artist: 'Yuri da Cunha', bpm: 110, key: 'C', energy: 7, genre: 'Semba' },
  { id: 8, title: 'Midnight Kiz', artist: 'DJ Snakes', bpm: 88, key: 'Bbm', energy: 2, genre: 'Urban Kiz' },
  { id: 9, title: 'Passion Flow', artist: 'C4 Pedro', bpm: 95, key: 'Ab', energy: 5, genre: 'Kizomba' },
  { id: 10, title: 'Zouk Bass Drop', artist: 'DJ Ly-COox', bpm: 100, key: 'Fm', energy: 9, genre: 'Ghetto Zouk' },
  { id: 11, title: 'Noite Sem Fim', artist: 'Matias Damásio', bpm: 91, key: 'Eb', energy: 4, genre: 'Kizomba' },
  { id: 12, title: 'Kuduro Bounce', artist: 'Burna Boy', bpm: 115, key: 'Gm', energy: 10, genre: 'Afrobeats' },
]

export function bpmCompatible(bpmA, bpmB) {
  return Math.abs(bpmA - bpmB) <= 6
}

export function keyCompatible(keyA, keyB) {
  const camelotMap = {
    'Ab': '1B', 'Fm': '1A', 'Eb': '2B', 'Cm': '2A', 'Bb': '3B', 'Gm': '3A',
    'F': '4B', 'Dm': '4A', 'C': '5B', 'Am': '5A', 'G': '6B', 'Em': '6A',
    'D': '7B', 'Bm': '7A', 'A': '8B', 'F#m': '8A', 'E': '9B', 'C#m': '9A',
    'B': '10B', 'G#m': '10A', 'F#': '11B', 'Ebm': '11A', 'Db': '12B', 'Bbm': '12A',
  }
  const a = camelotMap[keyA]
  const b = camelotMap[keyB]
  if (!a || !b) return null
  const numA = parseInt(a), numB = parseInt(b)
  const letterA = a.slice(-1), letterB = b.slice(-1)
  if (numA === numB) return true
  if (letterA === letterB && (Math.abs(numA - numB) === 1 || Math.abs(numA - numB) === 11)) return true
  return false
}

export function energyLabel(energy) {
  if (energy <= 3) return 'Low'
  if (energy <= 6) return 'Medium'
  if (energy <= 8) return 'High'
  return 'Peak'
}
