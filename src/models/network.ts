import type { Chain } from 'viem'
import type { Chains } from '../data/constants'

type NetworkConfiguration = {
  [key in Chains]: {
    rpc: string
    scan: string
    token: string
    chain_id: number
    viemChain?: Chain
  }
}

export type { NetworkConfiguration }
