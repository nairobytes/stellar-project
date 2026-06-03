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

async function simulateAndSend(
  callerPublicKey: string,
  operation: xdr.Operation
): Promise<SorobanRpc.Api.GetTransactionResponse> {
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
    throw new Error(`Contract simulation failed: ${simResult.error}`)
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build()
  const signedXdr = await signTransaction(preparedTx.toXDR(), NETWORK_PASSPHRASE, callerPublicKey)

  const submittedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const sendResult = await withRetry(() => server.sendTransaction(submittedTx))

  if (sendResult.status === 'ERROR') {
    logger.error('Send failed', { result: sendResult })
    throw new Error(`Transaction send failed: ${JSON.stringify(sendResult.errorResult)}`)
  }

  let getResult = await withRetry(() => server.getTransaction(sendResult.hash))
  let attempts = 0

  while (
    getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND &&
    attempts < 20
  ) {
    await new Promise((r) => setTimeout(r, 1500))
    getResult = await withRetry(() => server.getTransaction(sendResult.hash))
    attempts++
  }

  if (getResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status: ${getResult.status}`)
  }

  return getResult
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
  const s = String(val)
  const map: Record<string, InvoiceStatus> = {
    Pending: 'Pending',
    Funded: 'Funded',
    Repaid: 'Repaid',
    Overdue: 'Overdue',
    Defaulted: 'Defaulted',
  }
  return map[s] ?? 'Pending'
}

function scValToInvoice(val: xdr.ScVal): Invoice {
  const native = scValToNative(val) as Record<string, unknown>
  return {
    id: BigInt(String(native.id ?? 0)),
    supplier: String(native.supplier ?? ''),
    buyer: String(native.buyer ?? ''),
    amount: BigInt(String(native.amount ?? 0)),
    discount_bps: Number(native.discount_bps ?? 0),
    funded_amount: BigInt(String(native.funded_amount ?? 0)),
    status: parseInvoiceStatus(native.status),
    maturity_time: BigInt(String(native.maturity_time ?? 0)),
    investor: native.investor ? String(native.investor) : null,
    creation_time: BigInt(String(native.created_at ?? native.creation_time ?? 0)),
    repaid_amount: BigInt(String(native.repaid_at ?? native.repaid_amount ?? 0)),
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

  const result = await simulateAndSend(supplier, operation)
  const retval = (result as SorobanRpc.Api.GetSuccessfulTransactionResponse).returnValue
  if (!retval) throw new Error('No return value from create_invoice')
  const id = scValToNative(retval)
  return BigInt(String(id))
}

export async function fundInvoice(
  invoice_id: bigint,
  investor: string,
  usdc_contract: string,
  amount: bigint
): Promise<boolean> {
  logger.info('fundInvoice', { invoice_id: invoice_id.toString(), investor })

  const c = contract()
  const operation = c.call(
    'fund_invoice',
    nativeToScVal(invoice_id, { type: 'u64' }),
    Address.fromString(investor).toScVal(),
    Address.fromString(usdc_contract).toScVal(),
    nativeToScVal(amount, { type: 'i128' })
  )

  await simulateAndSend(investor, operation)
  return true
}

export async function repayInvoice(
  invoice_id: bigint,
  buyer: string,
  usdc_contract: string,
  repayment_amount: bigint
): Promise<boolean> {
  logger.info('repayInvoice', { invoice_id: invoice_id.toString(), buyer })

  const c = contract()
  const operation = c.call(
    'repay_invoice',
    nativeToScVal(invoice_id, { type: 'u64' }),
    Address.fromString(buyer).toScVal(),
    Address.fromString(usdc_contract).toScVal(),
    nativeToScVal(repayment_amount, { type: 'i128' })
  )

  await simulateAndSend(buyer, operation)
  return true
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
  logger.info('getAllInvoices — scanning on-chain')

  const server = rpc()

  try {
    const events = await withRetry(() =>
      server.getEvents({
        startLedger: 1,
        filters: [
          {
            type: 'contract',
            contractIds: [CONTRACT_ADDRESS],
            topics: [['*']],
          },
        ],
        limit: 200,
      })
    )

    const invoiceIds = new Set<bigint>()
    for (const event of events.events) {
      try {
        const topics = event.topic
        if (topics.length >= 2) {
          const idVal = scValToNative(topics[1])
          invoiceIds.add(BigInt(String(idVal)))
        }
      } catch {
        // skip unparseable events
      }
    }

    if (invoiceIds.size === 0) return []

    const invoices = await Promise.all(
      Array.from(invoiceIds).map((id) =>
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