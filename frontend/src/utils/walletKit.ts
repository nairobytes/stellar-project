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
