import { createGame } from './game'
import { ensureConnected, ensureChain, signSession, config } from './wallet'
import { writeContract } from '@wagmi/core'
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
  await writeContract(config, { address: passAddr, abi: passAbi, functionName: 'mint', args: [] })
}

async function submitScore() {
  await connectFlow()
  const score = game.getScore()
  await writeContract(config, { address: scoreAddr, abi: scoreAbi, functionName: 'submitScore', args: [score, hex32()] })
}

$('connect').onclick = connectFlow
$('mint').onclick = mintPass
$('submit').onclick = submitScore


