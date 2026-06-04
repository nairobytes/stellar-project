import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import {
  WalletConnectModule,
  WalletConnectTargetChain,
} from '@creit.tech/stellar-wallets-kit/modules/wallet-connect'
import {
  KitEventType,
  Networks,
  SwkAppLightTheme,
} from '@creit.tech/stellar-wallets-kit/types'
import {
  APP_METADATA,
  TESTNET_CONFIG,
  WALLET_CONNECT_ENABLED,
  WALLET_CONNECT_PROJECT_ID,
} from '../config'

let initialized = false

function normalizePassphrase(value: string | undefined): string {
  return (value || '').trim().toLowerCase()
}

export function initWalletKit(): void {
  if (initialized || typeof window === 'undefined') return

  const modules = [...defaultModules()]

  if (WALLET_CONNECT_ENABLED) {
    modules.push(
      new WalletConnectModule({
        projectId: WALLET_CONNECT_PROJECT_ID,
        metadata: APP_METADATA,
        allowedChains: [WalletConnectTargetChain.TESTNET],
      })
    )
  }

  StellarWalletsKit.init({
    modules,
    theme: SwkAppLightTheme,
    network: Networks.TESTNET,
    authModal: {
      showInstallLabel: true,
      hideUnsupportedWallets: false,
    },
  })

  initialized = true
}

export function isWalletKitReady(): boolean {
  return initialized
}

export async function connectViaWalletKit(): Promise<string> {
  initWalletKit()
  StellarWalletsKit.setNetwork(Networks.TESTNET)

  let lastError: unknown
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const { address } = await StellarWalletsKit.authModal()

      const network = await StellarWalletsKit.getNetwork()
      if (
        normalizePassphrase(network.networkPassphrase) !==
        normalizePassphrase(TESTNET_CONFIG.networkPassphrase)
      ) {
        await StellarWalletsKit.disconnect()
        throw new Error('Wrong network in wallet. Please switch to Stellar Testnet.')
      }

      return address
    } catch (err) {
      lastError = err
      if (isKitUserCancelError(err)) throw err
      if (shouldRetryWalletConnect(err) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 700))
        continue
      }
      throw err
    }
  }

  throw lastError
}

export async function getKitAddress(): Promise<string | null> {
  initWalletKit()
  try {
    const { address } = await StellarWalletsKit.getAddress()
    return address || null
  } catch {
    return null
  }
}

export async function disconnectWalletKit(): Promise<void> {
  if (!initialized) return
  await StellarWalletsKit.disconnect()
}

export async function signViaWalletKit(
  transactionXDR: string,
  address: string,
  networkPassphrase: string = TESTNET_CONFIG.networkPassphrase
): Promise<string> {
  initWalletKit()
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(transactionXDR, {
    networkPassphrase,
    address,
  })
  return signedTxXdr
}

export function subscribeWalletKit(
  handlers: {
    onDisconnect?: () => void
    onAddressChange?: (address: string | undefined) => void
    onWalletSelected?: (walletId: string | undefined) => void
  }
): () => void {
  initWalletKit()
  const unsubs: Array<() => void> = []

  if (handlers.onDisconnect) {
    unsubs.push(
      StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
        handlers.onDisconnect?.()
      })
    )
  }

  if (handlers.onAddressChange) {
    unsubs.push(
      StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
        handlers.onAddressChange?.(event.payload.address)
      })
    )
  }

  if (handlers.onWalletSelected) {
    unsubs.push(
      StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event) => {
        handlers.onWalletSelected?.(event.payload.id)
      })
    )
  }

  return () => {
    for (const unsub of unsubs) unsub()
  }
}

export function isKitUserCancelError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === -1
}

/** User-facing message for wallet / WalletConnect failures */
export function formatConnectError(err: unknown): string {
  if (isKitUserCancelError(err)) return ''

  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : err instanceof Error
        ? err.message
        : 'Failed to connect wallet'

  const ext =
    err && typeof err === 'object' && 'ext' in err && (err as { ext?: string }).ext
      ? String((err as { ext: string }).ext)
      : ''

  let text = ext && ext !== message ? `${message} — ${ext}` : message

  if (/not been started/i.test(text)) {
    return 'WalletConnect is still starting. Wait a few seconds and tap Choose wallet again.'
  }
  if (/wrong network/i.test(text)) {
    return 'Your wallet must be on Stellar Testnet. Switch network in Freighter, then connect again.'
  }
  if (/rejected|denied|cancelled|canceled|expired/i.test(text)) {
    return 'Connection was cancelled or rejected in your wallet app. Try again and approve the session.'
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    if (origin.startsWith('http://') && !origin.includes('localhost')) {
      text += ` Add ${origin} under Allowed origins at cloud.reown.com (Reown), or open this site in the Freighter app browser.`
    }
  }

  return text
}

function shouldRetryWalletConnect(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /not been started/i.test(msg)
}
