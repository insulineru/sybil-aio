import type { Address } from 'viem/accounts'
import { privateKeyToAccount } from 'viem/accounts'

export function getEvmWallet(privateKey: Address) {
  const account = privateKeyToAccount(privateKey)

  return account.address
}
