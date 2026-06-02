import * as Freighter from '@stellar/freighter-api'
import { Horizon } from 'stellar-sdk'
import { TESTNET_CONFIG } from '../config'
import { withRetry } from './retry'
import { logger } from './logger'

function horizonServer(): Horizon.Server {
  return new Horizon.Server(TESTNET_CONFIG.horizonUrl, { allowHttp: false })
}

function normalizePassphrase(value: string | undefined): string {
  return (value || '').trim().toLowerCase()
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const result = await Freighter.isAllowed()
    return Boolean(result.isAllowed !== undefined)
  } catch {
    return false
  }
}

export async function connectWallet(): Promise<string> {
  const allowed = await Freighter.isAllowed()
  if (!allowed.isAllowed) {
    const requested = await Freighter.requestAccess()
    if ('error' in requested && requested.error) {
      throw new Error(String(requested.error))
    }
  }

  const networkDetails = await Freighter.getNetworkDetails()
  if ('error' in networkDetails && networkDetails.error) {
    throw new Error(String(networkDetails.error))
  }

  if (
    normalizePassphrase(networkDetails.networkPassphrase) !==
    normalizePassphrase(TESTNET_CONFIG.networkPassphrase)
  ) {
    throw new Error(
      'Wrong network in Freighter. Please switch to Stellar Testnet.'
    )
  }

  const addressResult = await Freighter.getAddress()
  if (!addressResult.address) {
    throw new Error('Could not get address from Freighter.')
  }

  logger.info('Wallet connected', { address: addressResult.address })
  return addressResult.address
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
  networkPassphrase: string = TESTNET_CONFIG.networkPassphrase
): Promise<string> {
  const result = await Freighter.signTransaction(transactionXDR, {
    networkPassphrase,
  })

  if ('error' in result && result.error) {
    throw new Error(`Freighter rejected transaction: ${String(result.error)}`)
  }

  return result.signedTxXdr
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