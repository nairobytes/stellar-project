import { Horizon } from 'stellar-sdk'
import { TESTNET_CONFIG } from '../config'
import { withRetry } from './retry'
import { logger } from './logger'
import {
  connectViaWalletKit,
  getKitAddress,
  signViaWalletKit,
} from './walletKit'

function horizonServer(): Horizon.Server {
  return new Horizon.Server(TESTNET_CONFIG.horizonUrl, { allowHttp: false })
}

/** @deprecated Use wallet kit connect; kept for compatibility checks */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const { isAllowed } = await import('@stellar/freighter-api').then((m) => m.isAllowed())
    return Boolean(isAllowed !== undefined)
  } catch {
    return false
  }
}

export async function connectWallet(): Promise<string> {
  const publicKey = await connectViaWalletKit()
  logger.info('Wallet connected', { address: publicKey })
  return publicKey
}

export async function getConnectedPublicKey(): Promise<string | null> {
  return getKitAddress()
}

export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    const server = horizonServer()
    const account = await withRetry(() => server.loadAccount(publicKey))

    const usdcBalance = account.balances.find(
      (b) =>
        (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12') &&
        'asset_code' in b &&
        'asset_issuer' in b &&
        b.asset_code === 'USDC'
    )

    if (!usdcBalance) {
      logger.info('No USDC balance found — account may not have trustline', { publicKey })
      return '0.00'
    }

    const raw = parseFloat(usdcBalance.balance)
    return raw.toFixed(2)
  } catch (err) {
    logger.error('getUSDCBalance failed', { error: String(err) })
    return '0.00'
  }
}

export async function signTransaction(
  transactionXDR: string,
  networkPassphrase: string = TESTNET_CONFIG.networkPassphrase,
  signerPublicKey?: string
): Promise<string> {
  const address = signerPublicKey ?? (await getKitAddress())
  if (!address) {
    throw new Error('No wallet connected. Connect a wallet before signing.')
  }

  try {
    return await signViaWalletKit(transactionXDR, address, networkPassphrase)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Wallet rejected transaction: ${message}`)
  }
}

export async function getXLMBalance(publicKey: string): Promise<string> {
  try {
    const server = horizonServer()
    const account = await withRetry(() => server.loadAccount(publicKey))
    const native = account.balances.find((b) => b.asset_type === 'native')
    if (!native) return '0.00'
    return parseFloat(native.balance).toFixed(2)
  } catch {
    return '0.00'
  }
}

export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    const server = horizonServer()
    await server.loadAccount(publicKey)
    return true
  } catch {
    return false
  }
}
