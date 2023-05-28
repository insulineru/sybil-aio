import type { CexKeys, CexKeysWithPassword } from '../models/cex'

// Токен для работы бота. Получить можно у @BotFather в Telegram.
const TELEGRAM_BOT_TOKEN = ''
// Куда будут отправляться логи. Можно указать группу, контакт, канал.
const TELEGRAM_USER_ID = ''

// Здесь рекомендуется подставить свои значения RPC.
const NETWORKS = {
  ethereum: {
    rpc: 'https://rpc.ankr.com/eth',
    scan: 'https://etherscan.io/tx',
    token: 'ETH',
    chain_id: 1,
  },

  optimism: {
    rpc: 'https://rpc.ankr.com/optimism',
    scan: 'https://optimistic.etherscan.io/tx',
    token: 'ETH',
    chain_id: 10,
  },

  bsc: {
    rpc: 'https://rpc.ankr.com/bsc',
    scan: 'https://bscscan.com/tx',
    token: 'BNB',
    chain_id: 56,
  },

  polygon: {
    rpc: 'https://rpc.ankr.com/polygon',
    scan: 'https://polygonscan.com/tx',
    token: 'MATIC',
    chain_id: 137,
  },

  polygon_zkevm: {
    rpc: 'https://zkevm-rpc.com',
    scan: 'https://zkevm.polygonscan.com/tx',
    token: 'ETH',
    chain_id: 1101,
  },

  arbitrum: {
    rpc: 'https://rpc.ankr.com/arbitrum',
    scan: 'https://arbiscan.io/tx',
    token: 'ETH',
    chain_id: 42161,
  },

  avalanche: {
    rpc: 'https://rpc.ankr.com/avalanche',
    scan: 'https://snowtrace.io/tx',
    token: 'AVAX',
    chain_id: 43114,
  },

  fantom: {
    rpc: 'https://rpc.ankr.com/fantom',
    scan: 'https://ftmscan.com/tx',
    token: 'FTM',
    chain_id: 250,
  },

  nova: {
    rpc: 'https://nova.arbitrum.io/rpc',
    scan: 'https://nova.arbiscan.io/tx',
    token: 'ETH',
    chain_id: 42170,
  },

  zksync: {
    rpc: 'https://mainnet.era.zksync.io',
    scan: 'https://explorer.zksync.io/tx',
    token: 'ETH',
    chain_id: 324,
  },
}

// Апи ключи от бирж. если биржей не пользуешься, можно не вставлять
const CEX_KEYS: {
  [key: string]: CexKeys
} = {
  // binance: { api_key: 'your_api_key', api_secret: 'your_api_secret' },
  // mexc: { api_key: 'your_api_key', api_secret: 'your_api_secret' },
  // kucoin: { api_key: 'your_api_key', api_secret: 'your_api_secret', password: 'your_api_password' },
  // huobi: { api_key: 'your_api_key', api_secret: 'your_api_secret' },
  // bybit: { api_key: 'your_api_key', api_secret: 'your_api_secret' },
}

// можешь записать любое кол-во аккаунтов, сделал таким образом чтобы постоянно данные от новых акков не вводить, а просто вызывать по имени аккаунта
const OKX_KEYS: {
  [account_name: string]: CexKeysWithPassword
} = {
  account_1: {
    api_key: 'your_api_key',
    api_secret: 'your_api_secret',
    password: 'your_api_password',
  },
  account_2: {
    api_key: 'your_api_key',
    api_secret: 'your_api_secret',
    password: 'your_api_password',
  },
}

export { TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID, NETWORKS, CEX_KEYS, OKX_KEYS }
