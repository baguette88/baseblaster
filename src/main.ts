import { createGame } from './game'
import { ensureConnected, ensureChain, signSession, writeContract } from './wallet'
import { parseAbi } from 'viem'

const passAddr = (import.meta.env.VITE_PASS_ADDR || '0x0000000000000000000000000000000000000000') as `0x${string}`
const scoreAddr = (import.meta.env.VITE_SCORE_ADDR || '0x0000000000000000000000000000000000000000') as `0x${string}`

const scoreAbi = parseAbi(['function submitScore(uint32 score, bytes32 runId)'])
const passAbi = parseAbi(['function mint()'])

const game = createGame()
game.mount(document.body)

const $ = (id: string) => document.getElementById(id) as HTMLButtonElement

function hex32(): `0x${string}` {
  const b = new Uint8Array(32)
  crypto.getRandomValues(b)
  return ('0x' + Array.from(b, n => n.toString(16).padStart(2, '0')).join('')) as `0x${string}`
}

async function connectFlow() {
  await ensureConnected(); await ensureChain(); await signSession(crypto.randomUUID())
}

async function mintPass() {
  await connectFlow()
  await writeContract(passAddr, passAbi, 'mint', [])
}

async function submitScore() {
  await connectFlow()
  const score = game.getScore()
  await writeContract(scoreAddr, scoreAbi, 'submitScore', [score, hex32()])
}

$('connect').onclick = connectFlow
$('mint').onclick = mintPass
$('submit').onclick = submitScore

function openFarcaster(text: string) {
  const url = 'https://warpcast.com/~/compose?text=' + encodeURIComponent(text)
  window.open(url, '_blank')
}

$('share').onclick = () => {
  const s = game.getScore()
  const text = `Playing BaseBlaster on Base — score ${s}. Try it: ${location.href}`
  try { navigator.clipboard.writeText(`${location.href}`) } catch (_) {}
  openFarcaster(text)
}

// overlays
const startBtn = document.getElementById('start') as HTMLButtonElement
const overlay = document.getElementById('overlay') as HTMLElement
const over = document.getElementById('gameover') as HTMLElement
const restartBtn = document.getElementById('restart') as HTMLButtonElement

startBtn.onclick = () => { overlay.style.display = 'none'; over.style.display = 'none'; game.start() }
restartBtn.onclick = () => { over.style.display = 'none'; game.start() }


