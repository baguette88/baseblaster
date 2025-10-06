import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const pk = process.env.pk
if (!pk) throw new Error('Missing pk in .env')

const account = privateKeyToAccount(pk)
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })
const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() })

const PASS = process.env.VITE_PASS_ADDR
const SCORE = process.env.VITE_SCORE_ADDR
if (!PASS || !SCORE) throw new Error('Set VITE_PASS_ADDR and VITE_SCORE_ADDR in .env')

const passAbi = parseAbi(['function mint()'])
const scoreAbi = parseAbi([
  'function submitScore(uint32 score, bytes32 runId)',
  'function best(address) view returns (uint32)'
])

function hex32() { return '0x' + randomBytes(32).toString('hex') }

async function main() {
  console.log('Deployer', account.address)

  // Try mint (idempotent)
  try {
    const tx = await wallet.writeContract({ address: PASS, abi: passAbi, functionName: 'mint' })
    console.log('Mint tx', tx)
    await publicClient.waitForTransactionReceipt({ hash: tx })
  } catch (e) {
    console.log('Mint skipped/failed:', e.message || e)
  }

  // Submit a random test score
  const score = Math.floor(Math.random() * 500) + 50
  const runId = hex32()
  const tx2 = await wallet.writeContract({ address: SCORE, abi: scoreAbi, functionName: 'submitScore', args: [score, runId] })
  console.log('Score tx', tx2)
  await publicClient.waitForTransactionReceipt({ hash: tx2 })

  const best = await publicClient.readContract({ address: SCORE, abi: scoreAbi, functionName: 'best', args: [account.address] })
  console.log('Best score now:', best)
}

main().catch((e) => { console.error(e); process.exit(1) })


