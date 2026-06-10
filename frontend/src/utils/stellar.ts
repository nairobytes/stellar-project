import { Account, Address, Contract, Horizon, rpc as SorobanRpc, TransactionBuilder, scValToNative } from '@stellar/stellar-sdk'
import { TESTNET_CONFIG, USDC_ADDRESS, STROOPS_PER_UNIT } from '../config'
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

/** USDC held in the Soroban token contract (what fund/repay actually uses). */
export async function getSacUsdcBalanceStroops(publicKey: string): Promise<bigint> {
  const server = new SorobanRpc.Server(TESTNET_CONFIG.rpcUrl, { allowHttp: false })
  const c = new Contract(USDC_ADDRESS)
  const bootstrap = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
  const account = (await withRetry(() => server.getAccount(bootstrap))) as unknown as Account
  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: TESTNET_CONFIG.networkPassphrase,
  })
    .addOperation(c.call('balance', Address.fromString(publicKey).toScVal()))
    .setTimeout(30)
    .build()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sim = (await withRetry(() => server.simulateTransaction(tx))) as any
  if (SorobanRpc.Api.isSimulationError(sim)) return 0n
  if (!sim.result?.retval) return 0n
  try {
    return BigInt(String(scValToNative(sim.result.retval)))
  } catch {
    return 0n
  }
}

export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    const stroops = await getSacUsdcBalanceStroops(publicKey)
    return (Number(stroops) / STROOPS_PER_UNIT).toFixed(2)
  } catch (err) {
    logger.warn('SAC USDC balance read failed, trying Horizon', { error: String(err) })
  }

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
