import * as Freighter from '@stellar/freighter-api'
import { Account } from 'stellar-sdk'
import { TESTNET_CONFIG } from '../config'

const mockBalances = new Map<string, string>()

function normalizePassphrase(value: string | undefined): string {
  return (value || '').trim().toLowerCase()
}

// Check if Freighter is installed
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const result = await Freighter.isAllowed()
    return Boolean(result.isAllowed)
  } catch {
    return false
  }
}

// Connect wallet using Freighter
export async function connectWallet(): Promise<string> {
  try {
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
      throw new Error('Wrong network selected in Freighter. Please switch to Stellar Testnet.')
    }

    const addressResult = await Freighter.getAddress()
    if (!addressResult.address) {
      throw new Error('Freighter wallet not installed')
    }

    return addressResult.address
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Freighter wallet not installed')) {
      throw new Error('Freighter wallet not installed. Install it to connect.')
    }
    if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('rejected')) {
      throw new Error('Wallet connection request was rejected by the user.')
    }
    throw new Error(`Failed to connect wallet: ${message}`)
  }
}

// Get wallet balance (USDC)
export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    const cached = mockBalances.get(publicKey)
    if (cached) return cached
    const fallback = '1000.00'
    mockBalances.set(publicKey, fallback)
    return fallback
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to get balance: ${message}`)
  }
}

// Sign transaction with Freighter
export async function signTransaction(
  transactionXDR: string,
  networkPassphrase: string = TESTNET_CONFIG.networkPassphrase
): Promise<string> {
  try {
    const result = await Freighter.signTransaction(transactionXDR, {
      networkPassphrase,
    })
    if ('error' in result && result.error) {
      throw new Error(String(result.error))
    }

    return result.signedTxXdr
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to sign transaction: ${message}`)
  }
}

// Sign and send transaction
export async function signAndSendTransaction(
  transactionXDR: string,
  networkPassphrase: string = TESTNET_CONFIG.networkPassphrase
): Promise<string> {
  try {
    const signedXDR = await signTransaction(transactionXDR, networkPassphrase)
    return signedXDR
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to sign and send transaction: ${message}`)
  }
}

// Get account details from network
export async function getAccountDetails(publicKey: string): Promise<Account> {
  try {
    // Mock implementation - in production, fetch from Horizon
    return new Account(publicKey, '0')
  } catch (error) {
    throw new Error(`Failed to get account details: ${error}`)
  }
}
