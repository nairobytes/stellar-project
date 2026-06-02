import { SorobanRpc, Account, TransactionBuilder, BASE_FEE, Networks, Operation, xdr } from 'stellar-sdk'
import { CONTRACT_ADDRESS, TESTNET_CONFIG, CONTRACT_FUNCTIONS } from '../config'

const server = new SorobanRpc.Server(TESTNET_CONFIG.rpcUrl)

// Build a contract invocation transaction
export async function buildContractTx(
  publicKey: string,
  functionName: string,
  functionArgs: xdr.ScVal[],
  sourceAccount: Account
): Promise<TransactionBuilder> {
  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_CONFIG.networkPassphrase,
  })
    .addOperation(
      Operation.invokeHostFunction({
        hostFunction: xdr.HostFunction.hostFunctionTypeInvokeContract([
          xdr.ContractIdPreimage.contractIdFromSourceAccount({
            networkId: xdr.WrappedExternalCredential.stelexCredentialSourceStellar(
              xdr.Int64.fromString('0')
            ),
            address: xdr.ScAddress.scAddressTypeContract(
              xdr.Hash.fromXDR(CONTRACT_ADDRESS, 'base64')
            ),
            salt: xdr.Uint256.fromXDR(Buffer.alloc(32), 'raw'),
            envelope: xdr.ContractCodeSourceEnum.contractCodeSourceTypeWasm(),
          }),
          xdr.ScVal.scValTypeVec([]),
        ]),
        auth: [],
      })
    )
    .setTimeout(60)

  return builder
}

// Get server instance
export function getServer(): SorobanRpc.Server {
  return server
}

// Helper to convert string amounts to stroops
export function toStroops(amount: string): string {
  const num = parseFloat(amount)
  return Math.floor(num * 10_000_000).toString()
}

// Helper to convert stroops to string amounts
export function fromStroops(stroops: string | bigint): string {
  const num = typeof stroops === 'string' ? BigInt(stroops) : stroops
  return (Number(num) / 10_000_000).toFixed(7)
}

// Create contract invocation parameters
export function createContractParams(
  functionName: string,
  args: (string | number | boolean)[]
): any {
  return {
    contractId: CONTRACT_ADDRESS,
    method: functionName,
    args,
  }
}
