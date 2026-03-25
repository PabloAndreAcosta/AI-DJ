// Beat synthesizer using Web Audio API
// Generates genre-appropriate rhythmic patterns based on BPM

let audioCtx = null
let masterGain = null
let currentScheduler = null
let isRunning = false

// MUST be called directly from a user click handler (synchronously)
// before any awaits, so the browser allows audio
export function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = audioCtx.createGain()
    masterGain.connect(audioCtx.destination)
    masterGain.gain.value = 0.8
    console.log('🔊 AudioContext created:', audioCtx.state)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
    console.log('🔊 AudioContext resumed')
  }
  return audioCtx
}

function getContext() {
  return ensureAudioContext()
}

// ─── Sound primitives ────────────────────────────────────────

function playKick(ctx, time, gain = 0.7) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.connect(g)
  g.connect(masterGain)
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(30, time + 0.12)
  g.gain.setValueAtTime(gain, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
  osc.start(time)
  osc.stop(time + 0.3)
}

function playSnare(ctx, time, gain = 0.4) {
  // Noise burst
  const bufferSize = ctx.sampleRate * 0.1
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const g = ctx.createGain()
  noise.connect(g)
  g.connect(masterGain)
  g.gain.setValueAtTime(gain, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
  noise.start(time)

  // Body tone
  const osc = ctx.createOscillator()
  const g2 = ctx.createGain()
  osc.connect(g2)
  g2.connect(masterGain)
  osc.frequency.setValueAtTime(200, time)
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.05)
  g2.gain.setValueAtTime(gain * 0.5, time)
  g2.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
  osc.start(time)
  osc.stop(time + 0.08)
}

function playHihat(ctx, time, gain = 0.15, open = false) {
  const bufferSize = ctx.sampleRate * (open ? 0.15 : 0.05)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, open ? 2 : 5)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  // Highpass filter for metallic sound
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 7000
  noise.connect(filter)

  const g = ctx.createGain()
  filter.connect(g)
  g.connect(masterGain)
  g.gain.setValueAtTime(gain, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.15 : 0.05))
  noise.start(time)
}

function playBass(ctx, time, freq, duration, gain = 0.35) {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  const g = ctx.createGain()
  osc.connect(g)
  g.connect(masterGain)
  osc.frequency.setValueAtTime(freq, time)
  g.gain.setValueAtTime(gain, time)
  g.gain.setValueAtTime(gain, time + duration * 0.7)
  g.gain.exponentialRampToValueAtTime(0.001, time + duration)
  osc.start(time)
  osc.stop(time + duration)
}

function playPerc(ctx, time, freq = 800, gain = 0.12) {
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  const g = ctx.createGain()
  osc.connect(g)
  g.connect(masterGain)
  osc.frequency.setValueAtTime(freq, time)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.3, time + 0.06)
  g.gain.setValueAtTime(gain, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
  osc.start(time)
  osc.stop(time + 0.08)
}

// ─── Key to frequency ────────────────────────────────────────

const KEY_FREQ = {
  'C': 65.41, 'Db': 69.30, 'D': 73.42, 'Eb': 77.78, 'E': 82.41,
  'F': 87.31, 'F#': 92.50, 'G': 98.00, 'Ab': 103.83, 'A': 110.00,
  'Bb': 116.54, 'B': 123.47,
  'Cm': 65.41, 'C#m': 69.30, 'Dm': 73.42, 'Ebm': 77.78, 'Em': 82.41,
  'Fm': 87.31, 'F#m': 92.50, 'Gm': 98.00, 'G#m': 103.83, 'Am': 110.00,
  'Bbm': 116.54, 'Bm': 123.47,
}

function bassFreq(key) {
  return KEY_FREQ[key] || 82.41 // default E
}

// ─── Genre patterns (16-step sequencer per bar) ──────────────

function getPattern(genre) {
  // Each pattern: { kick: [...], snare: [...], hihat: [...], bass: [...], perc: [...] }
  // Values are step indices (0-15) in a 16-step bar
  switch (genre) {
    case 'Kizomba':
    case 'Ghetto Zouk':
      return {
        kick:  [0, 6, 8, 14],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        bass:  [0, 6, 8],
        perc:  [3, 11],
      }
    case 'Urban Kiz':
    case 'Tarraxo':
      return {
        kick:  [0, 8],
        snare: [4, 12],
        hihat: [2, 6, 10, 14],
        bass:  [0, 4, 8, 12],
        perc:  [7, 15],
      }
    case 'Semba':
      return {
        kick:  [0, 3, 6, 8, 11, 14],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        bass:  [0, 3, 8, 11],
        perc:  [2, 5, 10, 13],
      }
    case 'Zouk':
    case 'Kompa':
      return {
        kick:  [0, 6, 10],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        bass:  [0, 6, 10],
        perc:  [3, 7, 11, 15],
      }
    case 'Afrobeats':
      return {
        kick:  [0, 5, 8, 13],
        snare: [4, 12],
        hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        bass:  [0, 5, 8, 13],
        perc:  [2, 6, 10, 14],
      }
    case 'Kuduro':
    case 'Afro House':
      return {
        kick:  [0, 4, 8, 12],
        snare: [2, 6, 10, 14],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        bass:  [0, 4, 8, 12],
        perc:  [1, 3, 5, 7, 9, 11, 13, 15],
      }
    case 'Electro Cumbia':
      return {
        kick:  [0, 6, 8, 12],
        snare: [4, 14],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        bass:  [0, 6, 8, 12],
        perc:  [3, 7, 11],
      }
    case 'Folktronic':
      return {
        kick:  [0, 4, 8, 12],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        bass:  [0, 8],
        perc:  [2, 6, 10, 14],
      }
    default: // Generic
      return {
        kick:  [0, 8],
        snare: [4, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
        bass:  [0, 8],
        perc:  [],
      }
  }
}

// ─── Scheduler ───────────────────────────────────────────────

export function startBeat(track) {
  if (!track) return
  stopBeat()

  const ctx = getContext()
  const bpm = track.bpm || 95
  const stepDuration = 60 / bpm / 4  // 16th note duration
  const pattern = getPattern(track.genre)
  const baseFreq = bassFreq(track.key)
  const energy = (track.energy || 5) / 10  // 0-1

  isRunning = true
  let nextStepTime = ctx.currentTime + 0.05
  let currentStep = 0

  function schedule() {
    if (!isRunning) return

    while (nextStepTime < ctx.currentTime + 0.1) {
      const step = currentStep % 16

      if (pattern.kick.includes(step)) {
        playKick(ctx, nextStepTime, 0.5 + energy * 0.4)
      }
      if (pattern.snare.includes(step)) {
        playSnare(ctx, nextStepTime, 0.25 + energy * 0.25)
      }
      if (pattern.hihat.includes(step)) {
        playHihat(ctx, nextStepTime, 0.08 + energy * 0.1, step % 8 === 6)
      }
      if (pattern.bass.includes(step)) {
        // Vary bass note slightly based on position in bar
        const bassNote = step < 8 ? baseFreq : baseFreq * 1.25
        playBass(ctx, nextStepTime, bassNote, stepDuration * 1.5, 0.2 + energy * 0.2)
      }
      if (pattern.perc.includes(step)) {
        playPerc(ctx, nextStepTime, 600 + Math.random() * 400, 0.06 + energy * 0.08)
      }

      nextStepTime += stepDuration
      currentStep++
    }

    currentScheduler = setTimeout(schedule, 25)
  }

  schedule()
}

export function stopBeat() {
  isRunning = false
  if (currentScheduler) {
    clearTimeout(currentScheduler)
    currentScheduler = null
  }
}

export function setBeatVolume(volume) {
  if (masterGain) {
    masterGain.gain.setTargetAtTime(volume / 100, audioCtx.currentTime, 0.05)
  }
}

export function isBeatRunning() {
  return isRunning
}
