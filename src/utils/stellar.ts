import * as Freighter from '@stellar/freighter-api'
import { Keypair, TransactionBuilder, Account, BASE_FEE, Networks, FeeBumpTransaction } from 'stellar-sdk'
import { TESTNET_CONFIG } from '../config'

// Check if Freighter is installed
export async function isFreighterInstalled(): Promise<boolean> {
  return await Freighter.isAllowed()
}

// Connect wallet using Freighter
export async function connectWallet(): Promise<string> {
  try {
    const allowed = await Freighter.isAllowed()
    if (!allowed) {
      throw new Error('Freighter wallet not installed')
    }

    const publicKey = await Freighter.getPublicKey()
    if (!publicKey) {
      throw new Error('Failed to get public key from Freighter')
    }

    return publicKey
  } catch (error) {
    throw new Error(`Failed to connect wallet: ${error}`)
  }
}

// Get wallet balance (USDC)
export async function getUSDCBalance(publicKey: string): Promise<string> {
  try {
    // This would typically fetch from the blockchain
    // For now, return a mock balance
    return '1000.00'
  } catch (error) {
    throw new Error(`Failed to get balance: ${error}`)
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
    return result
  } catch (error) {
    throw new Error(`Failed to sign transaction: ${error}`)
  }
}

// Sign and send transaction
export async function signAndSendTransaction(
  transactionXDR: string,
  networkPassphrase: string = TESTNET_CONFIG.networkPassphrase
): Promise<string> {
  try {
    const signedXDR = await signTransaction(transactionXDR, networkPassphrase)
    // Send to the network using Horizon
    // This would be implemented with the stellar-sdk
    return signedXDR
  } catch (error) {
    throw new Error(`Failed to sign and send transaction: ${error}`)
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
