// Here is a brief technical description of each function in the Python script:
import { createWriteStream } from 'node:fs'
import Table from 'cli-table3'
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

function printBalancesTable(formattedBalances: Web3CheckerTokensResult, tokens: Web3CheckerTokens, tokenInfo: Web3ChekerTokenInfo) {
  let csvData = 'number,wallet,'
  const chainsList: Chains[] = []
  const totalBalances: { [chain: string]: { [token: string]: bigint } } = {}

  for (const chain of Object.keys(tokens) as Chains[]) {
    chainsList.push(chain)
    for (const token of tokens[chain]!) {
      csvData += `${tokenInfo[chain][token].symbol}-${chain},`
      totalBalances[chain] = totalBalances[chain] || {}
      totalBalances[chain][token] = BigInt(0) // Initialize total balance
    }
  }

  csvData = csvData.slice(0, -1) // Remove trailing comma
  csvData += '\n'

  // Add wallet balances
  let walletNumber = 1
  for (const wallet of Object.keys(formattedBalances)) {
    csvData += `${walletNumber++},${wallet},`
    for (const chain of chainsList) {
      for (const token of tokens[chain]!) {
        const balance = formattedBalances[wallet]![chain]![token]
        const decimals = tokenInfo[chain][token].decimals
        const readableBalance = formatUnits(balance, decimals)
        csvData += `${readableBalance},`
        totalBalances[chain][token] += balance
      }
    }
    csvData = csvData.slice(0, -1) // Remove trailing comma
    csvData += '\n'
  }

  // Add total balances
  csvData += ',TOTAL,'
  let totalValueUSD = 0
  const totalValuesPerTokenUSD: { [token: string]: number } = {}
  for (const chain of chainsList) {
    for (const token of tokens[chain]!) {
      const totalBalance = totalBalances[chain][token]
      const decimals = tokenInfo[chain][token].decimals
      const price = tokenInfo[chain][token].price
      const readableBalance = formatUnits(totalBalance, decimals)
      csvData += `${readableBalance},`
      const valueUSD = Number(readableBalance) * price!
      totalValueUSD += valueUSD
      const tokenSymbolWithChain = `${tokenInfo[chain][token].symbol}-${chain}`
      totalValuesPerTokenUSD[tokenSymbolWithChain] = (totalValuesPerTokenUSD[tokenSymbolWithChain] || 0) + valueUSD
    }
  }
  csvData = csvData.slice(0, -1) // Remove trailing comma
  csvData += '\n'

  // Add total value in USD
  csvData += `TOTAL_VALUE:,${totalValueUSD.toFixed(2)} $,`

  for (const chain of chainsList) {
    for (const token of tokens[chain]!) {
      const tokenValueUSD = totalValuesPerTokenUSD[`${tokenInfo[chain][token].symbol}-${chain}`]
      csvData += `${tokenValueUSD.toFixed(2)} $,`
    }
  }

  csvData = csvData.slice(0, -1) // Remove trailing comma
  csvData += '\n'

  // Convert CSV data to table format
  const lines = csvData.split('\n')
  const headers = lines[0].split(',')
  const tableData = lines.slice(1, -1).map(line => line.split(',')) // exclude the last line since it could be empty

  // Transpose the table data
  const transposedData = headers.map((header, i) => [header, ...tableData.map(row => row[i])])

  // Create a new table and push the transposed data into the table
  const table = new Table()
  transposedData.forEach(row => table.push(row))

  // Print the table to the console
  console.log(table.toString())

  // Write data to CSV file
  const csvStream = createWriteStream('balances.csv')
  csvStream.write(csvData)
  csvStream.end()
}

async function main() {
  const { tokens } = ONCHAIN_BALANCES_PARAMETERS
  const allBalances = await getBalances(tokens)
  const walletBalances = splitArray(allBalances, WALLETS.length)

  const formattedBalances = formatResults(walletBalances, WALLETS, tokens)

  const tokenInfo = await getTokenInfo(tokens)

  printBalancesTable(formattedBalances, tokens, tokenInfo)
}

main()
