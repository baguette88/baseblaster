import { createWalletClient, custom, getAddress, parseAbi, createPublicClient, http, signMessage, type Address } from 'viem'
import { baseSepolia } from 'viem/chains'

let wallet: ReturnType<typeof createWalletClient> | null = null
let account: Address | null = null

export async function ensureConnected() {
  if (typeof window === 'undefined') throw new Error('window required')
  const provider = (window as any).ethereum
  if (!provider) throw new Error('No injected wallet found')
  wallet = createWalletClient({ chain: baseSepolia, transport: custom(provider) })
  const [acc] = await provider.request({ method: 'eth_requestAccounts' })
  account = getAddress(acc)
  return account
}

export async function ensureChain() {
  if (!wallet) return
  try {
    await (window as any).ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x14A34' }] })
  } catch (_) {}
}

export async function signSession(nonce: string) {
  if (!wallet || !account) throw new Error('no wallet')
  return await wallet.signMessage({ account, message: `BaseBlaster session:${nonce}` })
}

export async function writeContract(address: Address, abi: any, functionName: string, args: any[]) {
  if (!wallet || !account) throw new Error('no wallet')
  return await wallet.writeContract({ address, abi, functionName, args, account })
}

export const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })


