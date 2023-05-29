import type { Chain, Hex, HttpTransport, PrivateKeyAccount, PublicClient, WalletClient } from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { NETWORKS } from '../data/config'
import type { Chains } from '../data/constants'

// TODO: Singleton maybe?
function getPublicClient({ network }: { network: Chains }): PublicClient {
  const { rpc, viemChain } = NETWORKS[network]

  return createPublicClient({ chain: viemChain, transport: http(rpc) })
}

function getWalletClient({ network, privateKey }: { network: Chains; privateKey: Hex }): WalletClient<HttpTransport, Chain, PrivateKeyAccount> {
  const { rpc, viemChain } = NETWORKS[network]

  return createWalletClient({ chain: viemChain, account: privateKeyToAccount(privateKey), transport: http(rpc) })
}

export { getPublicClient, getWalletClient }
