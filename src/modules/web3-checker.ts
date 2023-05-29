// Here is a brief technical description of each function in the Python script:

import type { Address, Hex } from 'viem'
import { formatUnits } from 'viem'
import { got } from 'got'
import { splitArray } from '../utils/split-array.js'
import { NETWORKS } from '../data/config.js'
import { getEvmWallet } from '../utils/get-evm-wallet.js'
import { ERC20_ABI } from '../data/abi.js'
import type { Chains } from '../data/constants.js'
import { WALLETS } from '../data/wallets.js'
import type { Web3CheckerTokens, Web3CheckerTokensResult, Web3ChekerTokenInfo } from '../models/web3-checker.js'
import { getPublicClient } from '../utils/get-clients.js'
import { ONCHAIN_BALANCES_PARAMETERS } from '../data/settings.js'

async function getTokenInfo(tokens: Web3CheckerTokens): Promise<Web3ChekerTokenInfo> {
  const chains = Object.keys(tokens) as Chains[]
  const clients = chains.map(chain => getPublicClient({ network: chain }))

  const symbolParams = {
    abi: ERC20_ABI,
    functionName: 'symbol',
  }

  const decimalsParams = {
    abi: ERC20_ABI,
    functionName: 'decimals',
  }

  const erc20Requests = clients.map(async (client, index) => {
    const chain = chains[index]
    const chainTokens = tokens[chain]?.filter(Boolean) as Address[]

    const contracts = chainTokens.flatMap(token => [
      {
        address: token,
        ...symbolParams,
      },
      {
        address: token,
        ...decimalsParams,
      },
    ])

    return await client.multicall({
      contracts,
    })
  })

  const erc20Results = (await Promise.all(erc20Requests)).map((chainResults, chainIndex) => {
    const chain = chains[chainIndex]
    const chainTokens = tokens[chain]?.filter(Boolean) as Address[]

    const chainInfo: any = {}
    chainResults.flat().forEach((el, index) => {
      const isSymbol = index % 2 === 0
      const tokenIndex = Math.floor(index / 2)
      const tokenAddress = chainTokens[tokenIndex]

      if (!chainInfo[tokenAddress])
        chainInfo[tokenAddress] = {}
      if (isSymbol)
        chainInfo[tokenAddress].symbol = el.result as string

      else
        chainInfo[tokenAddress].decimals = el.result as number
    })

    // check and process gas token
    if (tokens[chain]?.includes('')) {
      chainInfo[''] = {
        symbol: NETWORKS[chain].token,
        decimals: 18,
      }
    }

    return { [chain]: chainInfo }
  })

  const tokenInfo: Web3ChekerTokenInfo = Object.assign({}, ...erc20Results)

  // Fetching prices
  const uniqueSymbols = new Set<string>()
  for (const chain of Object.values(tokenInfo)) {
    for (const token of Object.values(chain))
      uniqueSymbols.add(token.symbol)
  }

  const priceRequests = Array.from(uniqueSymbols).map(async (symbol) => {
    try {
      const response = await got(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USDT`).json<{ USDT: number }>()
      return { [symbol]: response.USDT }
    }
    catch (error: any) {
      console.error(`Failed to fetch price for ${symbol}: ${error.message}`)
      return { [symbol]: 0 }
    }
  })

  const prices = Object.assign({}, ...(await Promise.all(priceRequests)))

  // Adding prices to token info
  for (const chain of Object.keys(tokenInfo) as Chains[]) {
    for (const token of Object.keys(tokenInfo[chain]!))
      tokenInfo[chain]![token].price = prices[tokenInfo![chain]![token].symbol] || 0
  }

  return tokenInfo
}

async function getBalances(tokens: Web3CheckerTokens) {
  const chains = Object.keys(tokens) as Chains[]

  const clients = chains.map(chain => getPublicClient({ network: chain }))

  const balanceParams = {
    abi: ERC20_ABI,
    functionName: 'balanceOf',
  }

  const erc20Requests = clients.map(async (client, index) => {
    const chain = chains[index]
    const chainTokens = tokens[chain]?.filter(Boolean) as Address[]

    const contracts = WALLETS.map((wallet) => {
      return chainTokens.map((token) => {
        return {
          address: token,
          args: [getEvmWallet(wallet)],
          ...balanceParams,
        }
      })
    }).flat()

    return await client.multicall({
      contracts,
    })
  })

  const erc20Results = (await Promise.all(erc20Requests)).flatMap((result) => {
    return result.flat().map(el => el.result as bigint)
  })

  const gasRequests = Object.entries(tokens).map(async ([chain, tokens]) => {
    if (tokens.includes('')) {
      const client = getPublicClient({ network: chain as Chains })

      const balances = await Promise.all(
        WALLETS.map(async (wallet) => {
          return await client.getBalance({ address: getEvmWallet(wallet) })
        }),
      )

      return balances.flat()
    }
  }).filter(Boolean)

  const gasResults = await (await Promise.all(gasRequests as Promise<bigint[]>[])).flat()

  return [...erc20Results, ...gasResults]
}

function formatResults(walletBalances: bigint[][], wallets: Hex[], tokens: Web3CheckerTokens) {
  const finalBalances: Web3CheckerTokensResult = {}
  wallets.forEach((privateKey, walletIndex) => {
    const wallet = getEvmWallet(privateKey)
    const walletBalance = walletBalances[walletIndex]
    let balanceIndex = 0

    for (const chain of Object.keys(tokens) as Chains[]) {
      if (!finalBalances[wallet])
        finalBalances[wallet] = {}

      const chainTokens = tokens[chain]
      if (chainTokens) {
        if (!finalBalances[wallet][chain])
          finalBalances[wallet][chain] = {}

        for (const token of chainTokens) {
          if (token) { // if not gas token
            finalBalances![wallet]![chain]![token] = walletBalance[balanceIndex++]
          }
        }
      }
    }

    for (const chain of Object.keys(tokens) as Chains[]) {
      if (!finalBalances[wallet])
        finalBalances[wallet] = {}

      const chainTokens = tokens[chain]
      if (chainTokens) {
        if (!finalBalances[wallet][chain])
          finalBalances[wallet][chain] = {}

        if (chainTokens.includes(''))
          finalBalances![wallet]![chain]![''] = walletBalance[balanceIndex++]
      }
    }
  })

  return finalBalances
}

function printBalancesTable(formattedBalances: Web3CheckerTokensResult, tokenInfo: Web3ChekerTokenInfo) {
  const table: any[] = []
  const walletsTotals: Record<string, number> = {}

  for (const [wallet, chains] of Object.entries(formattedBalances)) {
    let walletTotal = 0
    for (const [chain, tokens] of Object.entries(chains)) {
      for (const [token, balance] of Object.entries(tokens)) {
        const tokenSymbol = tokenInfo[chain][token].symbol
        const decimals = tokenInfo[chain][token].decimals
        const price = tokenInfo[chain][token].price
        const balanceReadable = parseFloat(formatUnits(balance, decimals))
        const usdValue = balanceReadable * price!
        walletTotal += usdValue

        table.push({
          'Wallet': wallet,
          'Chain': chain,
          'Token': tokenSymbol,
          'Balance': balanceReadable,
          'Value in USD': usdValue,
        })
      }
    }

    walletsTotals[wallet] = walletTotal
  }

  console.table(table)

  console.log('Total value of each wallet:')
  for (const [wallet, total] of Object.entries(walletsTotals))
    console.log(`${wallet}: ${total} USD`)
}

async function main() {
  const { tokens } = ONCHAIN_BALANCES_PARAMETERS
  const allBalances = await getBalances(tokens)
  const walletBalances = splitArray(allBalances, WALLETS.length)

  const formattedBalances = formatResults(walletBalances, WALLETS, tokens)

  const tokenInfo = await getTokenInfo(tokens)

  printBalancesTable(formattedBalances, tokenInfo)
}

main()
