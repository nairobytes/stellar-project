import {
  authorizeEntry,
  Operation,
  StrKey,
  Transaction,
  TransactionBuilder,
  xdr,
} from 'stellar-sdk'
import { signAuthEntry as freighterSignAuthEntry, isConnected, isAllowed } from '@stellar/freighter-api'
import { TESTNET_CONFIG } from '../config'

async function signAuthPreimage(
  preimage: xdr.HashIdPreimage,
  signerPublicKey: string
): Promise<Buffer> {
  const connected = await isConnected()
  const allowed = connected.isConnected ? await isAllowed() : { isAllowed: false }
  if (!connected.isConnected || !allowed.isAllowed) {
    throw new Error(
      'Soroban authorization requires the Freighter browser extension. Connect with Freighter on Testnet, then try again.',
    )
  }

  const { signedAuthEntry, error } = await freighterSignAuthEntry(preimage.toXDR('base64'), {
    networkPassphrase: TESTNET_CONFIG.networkPassphrase,
    address: signerPublicKey,
  })

  if (error) {
    throw new Error(error.message || 'Freighter rejected Soroban authorization')
  }
  if (!signedAuthEntry) {
    throw new Error('Freighter did not return a signed authorization')
  }

  return Buffer.from(signedAuthEntry, 'base64')
}

/** Sign Soroban auth entries for `signerPublicKey` on an assembled invokeHostFunction tx. */
export async function signSorobanAuthorizationEntries(
  transaction: Transaction,
  signerPublicKey: string,
  authLedgerExpiration: number
): Promise<Transaction> {
  const op = transaction.operations[0]
  if (!op || op.type !== 'invokeHostFunction') {
    return transaction
  }

  const authEntries = op.auth ?? []
  if (authEntries.length === 0) {
    return transaction
  }

  const signedAuth: xdr.SorobanAuthorizationEntry[] = []
  let changed = false

  for (const entry of authEntries) {
    if (
      entry.credentials().switch().name !==
      xdr.SorobanCredentialsType.sorobanCredentialsAddress().name
    ) {
      signedAuth.push(entry)
      continue
    }

    const entryPk = StrKey.encodeEd25519PublicKey(
      entry.credentials().address().address().accountId().ed25519()
    )

    if (entryPk !== signerPublicKey) {
      signedAuth.push(entry)
      continue
    }

    const signed = await authorizeEntry(
      entry,
      async (preimage) => signAuthPreimage(preimage, signerPublicKey),
      authLedgerExpiration,
      TESTNET_CONFIG.networkPassphrase
    )
    signedAuth.push(signed)
    changed = true
  }

  if (!changed) {
    return transaction
  }

  const builder = TransactionBuilder.cloneFrom(transaction, {
    fee: transaction.fee,
    networkPassphrase: transaction.networkPassphrase,
  })

  builder.clearOperations()
  builder.addOperation(
    Operation.invokeHostFunction({
      func: op.func,
      auth: signedAuth,
      source: op.source,
    })
  )

  return builder.build()
}
