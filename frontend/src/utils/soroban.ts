import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
} from 'stellar-sdk'
import { signTransaction } from './stellar'
import { CONTRACT_ADDRESS, TESTNET_CONFIG, USDC_ADDRESS, BASIS_POINTS_DIVISOR, INVESTOR_YIELD_BPS } from '../config'
import { Invoice, InvoiceStatus } from '../types'
import { withRetry } from './retry'
import { logger } from './logger'

const RPC_URL = TESTNET_CONFIG.rpcUrl
const NETWORK_PASSPHRASE = TESTNET_CONFIG.networkPassphrase
const BASE_FEE = '100000'
const TX_TIMEOUT = 30

function rpc(): SorobanRpc.Server {
  return new SorobanRpc.Server(RPC_URL, { allowHttp: false })
}

function contract(): Contract {
  return new Contract(CONTRACT_ADDRESS)
}

/** Poll RPC without parsing XDR meta (stellar-sdk v11 breaks on TransactionMeta v4). */
async function waitForTransactionSuccess(hash: string): Promise<void> {
  for (let attempts = 0; attempts < 20; attempts++) {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: { hash },
      }),
    })

    const body = (await response.json()) as {
      result?: { status?: string }
      error?: { message?: string }
    }

    const status = body.result?.status
    if (status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) return
    if (status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Transaction failed on-chain')
    }

    await new Promise((r) => setTimeout(r, 1500))
  }

  throw new Error('Transaction confirmation timed out')
}

function parseScValU64(val: xdr.ScVal): bigint {
  try {
    return BigInt(String(scValToNative(val)))
  } catch {
    if (val.switch().name === 'scvU64') {
      return BigInt(val.u64().toString())
    }
    throw new Error('Could not parse contract return value as u64')
  }
}

/** Normalize Stellar G/C addresses for reliable string comparison */
export function normalizeStellarAddress(addr: string | null | undefined): string {
  if (!addr) return ''
  const trimmed = String(addr).trim()
  if (!trimmed) return ''
  try {
    return Address.fromString(trimmed).toString()
  } catch {
    return trimmed.toUpperCase()
  }
}

export function stellarAddressesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeStellarAddress(a)
  const nb = normalizeStellarAddress(b)
  return na.length > 0 && na === nb
}

function formatSimulationError(error: string | undefined): string {
  const raw = error ?? 'Contract simulation failed'
  if (/cannot be repaid in current status/i.test(raw)) {
    return 'This invoice is not funded yet. An investor must fund it before you can repay.'
  }
  if (/not available for funding/i.test(raw)) {
    return 'This invoice is not pending — it may already be funded or repaid.'
  }
  if (/not the invoice buyer/i.test(raw)) {
    return 'Your connected wallet is not the buyer on this invoice.'
  }
  if (/Invoice not found/i.test(raw)) {
    return 'Invoice ID not found on-chain. Check the ID in Your obligations.'
  }
  if (/trustline entry is missing/i.test(raw)) {
    return 'The supplier cannot receive USDC yet. They must open the Supplier dashboard and tap Enable USDC payouts once, then you can fund again.'
  }
  if (/not within the allowed range|Error\(Contract,\s*#10\)/i.test(raw)) {
    return 'Not enough USDC in your wallet for this transaction.'
  }
  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw
}

function scValToBigInt(val: unknown): bigint {
  if (typeof val === 'bigint') return val
  if (typeof val === 'number') return BigInt(Math.trunc(val))
  if (typeof val === 'string') return BigInt(val)
  if (val && typeof val === 'object' && 'hi' in val && 'lo' in val) {
    const { hi, lo } = val as { hi: number | bigint; lo: number | bigint }
    return (BigInt(hi) << 64n) + BigInt(lo)
  }
  return BigInt(String(val ?? 0))
}

type SimulateAndSendResult = {
  hash: string
  simulatedReturnVal?: xdr.ScVal
}

async function simulateAndSend(
  callerPublicKey: string,
  operation: xdr.Operation
): Promise<SimulateAndSendResult> {
  const server = rpc()

  const account = await withRetry(() => server.getAccount(callerPublicKey))

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(TX_TIMEOUT)
    .build()

  const simResult = await withRetry(() => server.simulateTransaction(tx))

  if (SorobanRpc.Api.isSimulationError(simResult)) {
    logger.error('Simulation failed', { error: simResult.error })
    throw new Error(formatSimulationError(simResult.error))
  }

  const simulatedReturnVal = simResult.result?.retval
  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build()
  const signedXdr = await signTransaction(preparedTx.toXDR(), NETWORK_PASSPHRASE, callerPublicKey)

  const submittedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const sendResult = await withRetry(() => server.sendTransaction(submittedTx))

  if (sendResult.status === 'ERROR') {
    logger.error('Send failed', { result: sendResult })
    throw new Error(`Transaction send failed: ${JSON.stringify(sendResult.errorResult)}`)
  }

  await waitForTransactionSuccess(sendResult.hash)

  return { hash: sendResult.hash, simulatedReturnVal }
}

async function readContract(method: string, args: xdr.ScVal[]): Promise<xdr.ScVal> {
  const server = rpc()
  const c = contract()

  const operation = c.call(method, ...args)

  const dummyKeypair = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'
  const account = await withRetry(() => server.getAccount(dummyKeypair).catch(() =>
    server.getAccount('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
  ))

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(TX_TIMEOUT)
    .build()

  const simResult = await withRetry(() => server.simulateTransaction(tx))

  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Read simulation failed: ${simResult.error}`)
  }

  if (!simResult.result?.retval) {
    throw new Error('No return value from contract read')
  }

  return simResult.result.retval
}

function parseInvoiceStatus(val: unknown): InvoiceStatus {
  const raw =
    Array.isArray(val) && val.length > 0
      ? String(val[0])
      : val && typeof val === 'object' && val !== null && !Array.isArray(val)
        ? String(Object.keys(val)[0] ?? '')
        : String(val)

  const map: Record<string, InvoiceStatus> = {
    Pending: 'Pending',
    Funded: 'Funded',
    Repaid: 'Repaid',
    Overdue: 'Overdue',
    Defaulted: 'Defaulted',
  }
  return map[raw] ?? 'Pending'
}

function parseScValAddress(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return normalizeStellarAddress(val)
  if (typeof val === 'object' && val !== null) {
    if ('address' in val) return normalizeStellarAddress(String((val as { address: string }).address))
    if ('value' in val) return parseScValAddress((val as { value: unknown }).value)
  }
  return normalizeStellarAddress(String(val))
}

function scValToInvoice(val: xdr.ScVal): Invoice {
  const native = scValToNative(val) as Record<string, unknown>
  const investor = native.investor
  return {
    id: scValToBigInt(native.id),
    supplier: parseScValAddress(native.supplier),
    buyer: parseScValAddress(native.buyer),
    amount: scValToBigInt(native.amount),
    discount_bps: Number(native.discount_bps ?? 0),
    funded_amount: scValToBigInt(native.funded_amount),
    status: parseInvoiceStatus(native.status),
    maturity_time: scValToBigInt(native.maturity_time),
    investor:
      investor === null || investor === undefined || investor === 'void'
        ? null
        : parseScValAddress(investor),
    creation_time: scValToBigInt(native.created_at ?? native.creation_time ?? 0),
    repaid_amount: scValToBigInt(native.repaid_at ?? native.repaid_amount ?? 0),
  }
}

export async function createInvoice(
  supplier: string,
  buyer: string,
  amount: bigint,
  discount_bps: number,
  maturity_time: bigint
): Promise<bigint> {
  logger.info('createInvoice', { supplier, buyer, amount: amount.toString(), discount_bps })

  const c = contract()
  const operation = c.call(
    'create_invoice',
    Address.fromString(supplier).toScVal(),
    Address.fromString(buyer).toScVal(),
    nativeToScVal(amount, { type: 'i128' }),
    nativeToScVal(discount_bps, { type: 'u32' }),
    nativeToScVal(maturity_time, { type: 'u64' })
  )

  const { simulatedReturnVal } = await simulateAndSend(supplier, operation)
  if (!simulatedReturnVal) {
    throw new Error('No return value from create_invoice simulation')
  }
  return parseScValU64(simulatedReturnVal)
}

export async function fundInvoice(
  invoice_id: bigint,
  investor: string,
  usdc_contract: string
): Promise<boolean> {
  logger.info('fundInvoice', { invoice_id: invoice_id.toString(), investor })

  const c = contract()
  const operation = c.call(
    'fund_invoice',
    Address.fromString(investor).toScVal(),
    nativeToScVal(invoice_id, { type: 'u64' }),
    Address.fromString(usdc_contract).toScVal()
  )

  await simulateAndSend(investor, operation)
  return true
}

export async function repayInvoice(
  invoice_id: bigint,
  buyer: string,
  usdc_contract: string
): Promise<boolean> {
  logger.info('repayInvoice', { invoice_id: invoice_id.toString(), buyer })

  const c = contract()
  const operation = c.call(
    'repay_invoice',
    Address.fromString(buyer).toScVal(),
    nativeToScVal(invoice_id, { type: 'u64' }),
    Address.fromString(usdc_contract).toScVal()
  )

  await simulateAndSend(buyer, operation)
  return true
}

/** One-time SAC setup so a wallet can receive USDC payouts (supplier / buyer). */
export async function establishSacUsdcTrust(account: string): Promise<void> {
  logger.info('establishSacUsdcTrust', { account })
  const token = new Contract(USDC_ADDRESS)
  const operation = token.call('trust', Address.fromString(account).toScVal())
  await simulateAndSend(account, operation)
}

export async function getInvoiceCount(): Promise<bigint> {
  const retval = await readContract('get_invoice_count', [])
  return scValToBigInt(scValToNative(retval))
}

export async function getInvoice(invoice_id: bigint): Promise<Invoice> {
  logger.info('getInvoice', { invoice_id: invoice_id.toString() })

  const retval = await readContract('get_invoice', [
    nativeToScVal(invoice_id, { type: 'u64' }),
  ])

  return scValToInvoice(retval)
}

export async function getSupplierInvoices(supplier: string): Promise<bigint[]> {
  logger.info('getSupplierInvoices', { supplier })

  const retval = await readContract('get_supplier_invoices', [
    Address.fromString(supplier).toScVal(),
  ])

  const native = scValToNative(retval) as unknown[]
  return native.map((id) => BigInt(String(id)))
}

export async function getCreditScore(supplier: string): Promise<number> {
  logger.info('getCreditScore', { supplier })

  const retval = await readContract('get_credit_score', [
    Address.fromString(supplier).toScVal(),
  ])

  return Number(scValToNative(retval))
}

export async function markOverdue(invoice_id: bigint): Promise<boolean> {
  logger.info('markOverdue', { invoice_id: invoice_id.toString() })

  const server = rpc()
  const c = contract()

  const account = await withRetry(() =>
    server.getAccount('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
  )

  const operation = c.call(
    'mark_overdue',
    nativeToScVal(invoice_id, { type: 'u64' })
  )

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(TX_TIMEOUT)
    .build()

  const simResult = await withRetry(() => server.simulateTransaction(tx))
  if (SorobanRpc.Api.isSimulationError(simResult)) return false

  const retval = simResult.result?.retval
  if (!retval) return false
  return Boolean(scValToNative(retval))
}

export async function markDefaulted(invoice_id: bigint): Promise<boolean> {
  logger.info('markDefaulted', { invoice_id: invoice_id.toString() })

  const retval = await readContract('mark_defaulted', [
    nativeToScVal(invoice_id, { type: 'u64' }),
  ])

  return Boolean(scValToNative(retval))
}

export async function updateCreditScore(supplier: string, newScore: number): Promise<void> {
  logger.info('updateCreditScore', { supplier, newScore })

  const c = contract()
  const operation = c.call(
    'update_credit_score',
    Address.fromString(supplier).toScVal(),
    nativeToScVal(newScore, { type: 'u32' })
  )

  await simulateAndSend(supplier, operation)
}

export async function getAllInvoices(): Promise<Invoice[]> {
  logger.info('getAllInvoices — reading invoice count from contract')

  try {
    const count = await getInvoiceCount()
    if (count <= 0n) return []

    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1))
    const invoices = await Promise.all(
      ids.map((id) =>
        getInvoice(id).catch((err) => {
          logger.warn('Failed to fetch invoice', { id: id.toString(), error: String(err) })
          return null
        })
      )
    )

    return invoices.filter((inv): inv is Invoice => inv !== null)
  } catch (err) {
    logger.error('getAllInvoices failed', { error: String(err) })
    return []
  }
}

export { BASIS_POINTS_DIVISOR, INVESTOR_YIELD_BPS, USDC_ADDRESS }