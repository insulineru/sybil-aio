import type { Address } from 'viem'
import type { Chains } from '../data/constants.js'

type Web3CheckerTokens = {
  [key in Chains]?: Array<Address | ''>
}

interface Web3ChekerTokenInfo {
  [key: string]: {
    [key: string]: {
      symbol: string
      decimals: number
      address: Address
      price?: number
    }
  }
}

interface Web3CheckerTokensResult {
  [wallet: string]: {
    [chain in Chains]?: {
      [token: string]: bigint
    }
  }
}

interface Web3CheckerAlert {
  chain: Chains
  coin: Address | ''
  amount: number
}

type Web3CheckerGasAmountLimit = {
  [key in Chains]?: number
}

interface Web3CheckerParameters {
  tokens: Web3CheckerTokens
  alerts: Web3CheckerAlert[]
  fileName: string
  isNeedSaveToFile: boolean
  // maxGwei?: number
  // gasLimits: Web3CheckerGasAmountLimit
  // isNeedTgAlerts: boolean
  // isNeedTgBalances: boolean
  // isCheckGweiEnabled: boolean
}

export type { Web3CheckerTokens, Web3ChekerTokenInfo, Web3CheckerTokensResult, Web3CheckerAlert, Web3CheckerGasAmountLimit, Web3CheckerParameters }
