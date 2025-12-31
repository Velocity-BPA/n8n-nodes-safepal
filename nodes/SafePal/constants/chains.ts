/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal Supported Blockchain Networks
 *
 * SafePal hardware wallets support 54+ blockchain networks.
 * This file contains configurations for all supported chains.
 */

export interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  chainId?: number;
  slip44: number;
  type: 'evm' | 'bitcoin' | 'solana' | 'cosmos' | 'polkadot' | 'near' | 'aptos' | 'sui' | 'xrp' | 'cardano' | 'tron' | 'other';
  decimals: number;
  rpcUrl?: string;
  explorerUrl?: string;
  testnetChainId?: number;
  testnetRpcUrl?: string;
  testnetExplorerUrl?: string;
  derivationPath: string;
  addressPrefix?: string;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  // Bitcoin and Bitcoin-like
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    slip44: 0,
    type: 'bitcoin',
    decimals: 8,
    explorerUrl: 'https://blockstream.info',
    derivationPath: "m/84'/0'/0'/0/0",
  },
  litecoin: {
    id: 'litecoin',
    name: 'Litecoin',
    symbol: 'LTC',
    slip44: 2,
    type: 'bitcoin',
    decimals: 8,
    explorerUrl: 'https://blockchair.com/litecoin',
    derivationPath: "m/84'/2'/0'/0/0",
  },
  dogecoin: {
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    slip44: 3,
    type: 'bitcoin',
    decimals: 8,
    explorerUrl: 'https://dogechain.info',
    derivationPath: "m/44'/3'/0'/0/0",
  },
  bitcoinCash: {
    id: 'bitcoinCash',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    slip44: 145,
    type: 'bitcoin',
    decimals: 8,
    explorerUrl: 'https://blockchair.com/bitcoin-cash',
    derivationPath: "m/44'/145'/0'/0/0",
  },
  dash: {
    id: 'dash',
    name: 'Dash',
    symbol: 'DASH',
    slip44: 5,
    type: 'bitcoin',
    decimals: 8,
    explorerUrl: 'https://blockchair.com/dash',
    derivationPath: "m/44'/5'/0'/0/0",
  },
  zcash: {
    id: 'zcash',
    name: 'Zcash',
    symbol: 'ZEC',
    slip44: 133,
    type: 'bitcoin',
    decimals: 8,
    explorerUrl: 'https://blockchair.com/zcash',
    derivationPath: "m/44'/133'/0'/0/0",
  },

  // EVM Chains
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    testnetChainId: 11155111,
    testnetRpcUrl: 'https://rpc.sepolia.org',
    testnetExplorerUrl: 'https://sepolia.etherscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  binanceSmartChain: {
    id: 'binanceSmartChain',
    name: 'BNB Chain',
    symbol: 'BNB',
    chainId: 56,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    testnetChainId: 97,
    testnetRpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    testnetExplorerUrl: 'https://testnet.bscscan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    testnetChainId: 80001,
    testnetRpcUrl: 'https://rpc-mumbai.maticvigil.com',
    testnetExplorerUrl: 'https://mumbai.polygonscan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ETH',
    chainId: 42161,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    testnetChainId: 421614,
    testnetRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    testnetExplorerUrl: 'https://sepolia.arbiscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    chainId: 10,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    testnetChainId: 11155420,
    testnetRpcUrl: 'https://sepolia.optimism.io',
    testnetExplorerUrl: 'https://sepolia-optimistic.etherscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    chainId: 43114,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    testnetChainId: 43113,
    testnetRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    testnetExplorerUrl: 'https://testnet.snowtrace.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  fantom: {
    id: 'fantom',
    name: 'Fantom',
    symbol: 'FTM',
    chainId: 250,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    testnetChainId: 4002,
    testnetRpcUrl: 'https://rpc.testnet.fantom.network',
    testnetExplorerUrl: 'https://testnet.ftmscan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  cronos: {
    id: 'cronos',
    name: 'Cronos',
    symbol: 'CRO',
    chainId: 25,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://evm.cronos.org',
    explorerUrl: 'https://cronoscan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  gnosis: {
    id: 'gnosis',
    name: 'Gnosis Chain',
    symbol: 'xDAI',
    chainId: 100,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.gnosischain.com',
    explorerUrl: 'https://gnosisscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    chainId: 8453,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    testnetChainId: 84532,
    testnetRpcUrl: 'https://sepolia.base.org',
    testnetExplorerUrl: 'https://sepolia.basescan.org',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  zkSync: {
    id: 'zkSync',
    name: 'zkSync Era',
    symbol: 'ETH',
    chainId: 324,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    testnetChainId: 280,
    testnetRpcUrl: 'https://testnet.era.zksync.dev',
    testnetExplorerUrl: 'https://goerli.explorer.zksync.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  linea: {
    id: 'linea',
    name: 'Linea',
    symbol: 'ETH',
    chainId: 59144,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  scroll: {
    id: 'scroll',
    name: 'Scroll',
    symbol: 'ETH',
    chainId: 534352,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  mantle: {
    id: 'mantle',
    name: 'Mantle',
    symbol: 'MNT',
    chainId: 5000,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.mantle.xyz',
    explorerUrl: 'https://explorer.mantle.xyz',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  celo: {
    id: 'celo',
    name: 'Celo',
    symbol: 'CELO',
    chainId: 42220,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://celoscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  moonbeam: {
    id: 'moonbeam',
    name: 'Moonbeam',
    symbol: 'GLMR',
    chainId: 1284,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.api.moonbeam.network',
    explorerUrl: 'https://moonscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  moonriver: {
    id: 'moonriver',
    name: 'Moonriver',
    symbol: 'MOVR',
    chainId: 1285,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.api.moonriver.moonbeam.network',
    explorerUrl: 'https://moonriver.moonscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    symbol: 'ETH',
    chainId: 1313161554,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.aurora.dev',
    explorerUrl: 'https://aurorascan.dev',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  boba: {
    id: 'boba',
    name: 'Boba Network',
    symbol: 'ETH',
    chainId: 288,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.boba.network',
    explorerUrl: 'https://bobascan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  klaytn: {
    id: 'klaytn',
    name: 'Klaytn',
    symbol: 'KLAY',
    chainId: 8217,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://public-node-api.klaytnapi.com/v1/cypress',
    explorerUrl: 'https://scope.klaytn.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  metis: {
    id: 'metis',
    name: 'Metis',
    symbol: 'METIS',
    chainId: 1088,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://andromeda.metis.io/?owner=1088',
    explorerUrl: 'https://andromeda-explorer.metis.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  polygonZkEvm: {
    id: 'polygonZkEvm',
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    chainId: 1101,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://zkevm-rpc.com',
    explorerUrl: 'https://zkevm.polygonscan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  opBnb: {
    id: 'opBnb',
    name: 'opBNB',
    symbol: 'BNB',
    chainId: 204,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://opbnb-mainnet-rpc.bnbchain.org',
    explorerUrl: 'https://opbnbscan.com',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  manta: {
    id: 'manta',
    name: 'Manta Pacific',
    symbol: 'ETH',
    chainId: 169,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://pacific-rpc.manta.network/http',
    explorerUrl: 'https://pacific-explorer.manta.network',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  blast: {
    id: 'blast',
    name: 'Blast',
    symbol: 'ETH',
    chainId: 81457,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://rpc.blast.io',
    explorerUrl: 'https://blastscan.io',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  mode: {
    id: 'mode',
    name: 'Mode',
    symbol: 'ETH',
    chainId: 34443,
    slip44: 60,
    type: 'evm',
    decimals: 18,
    rpcUrl: 'https://mainnet.mode.network',
    explorerUrl: 'https://explorer.mode.network',
    derivationPath: "m/44'/60'/0'/0/0",
  },

  // Solana
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    slip44: 501,
    type: 'solana',
    decimals: 9,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    testnetRpcUrl: 'https://api.devnet.solana.com',
    testnetExplorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    derivationPath: "m/44'/501'/0'/0'",
  },

  // Cosmos Ecosystem
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    slip44: 118,
    type: 'cosmos',
    decimals: 6,
    rpcUrl: 'https://cosmos-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    derivationPath: "m/44'/118'/0'/0/0",
    addressPrefix: 'cosmos',
  },
  osmosis: {
    id: 'osmosis',
    name: 'Osmosis',
    symbol: 'OSMO',
    slip44: 118,
    type: 'cosmos',
    decimals: 6,
    rpcUrl: 'https://osmosis-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/osmosis',
    derivationPath: "m/44'/118'/0'/0/0",
    addressPrefix: 'osmo',
  },
  juno: {
    id: 'juno',
    name: 'Juno',
    symbol: 'JUNO',
    slip44: 118,
    type: 'cosmos',
    decimals: 6,
    rpcUrl: 'https://juno-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/juno',
    derivationPath: "m/44'/118'/0'/0/0",
    addressPrefix: 'juno',
  },
  evmos: {
    id: 'evmos',
    name: 'Evmos',
    symbol: 'EVMOS',
    slip44: 60,
    type: 'cosmos',
    decimals: 18,
    rpcUrl: 'https://evmos-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/evmos',
    derivationPath: "m/44'/60'/0'/0/0",
    addressPrefix: 'evmos',
  },
  kava: {
    id: 'kava',
    name: 'Kava',
    symbol: 'KAVA',
    slip44: 459,
    type: 'cosmos',
    decimals: 6,
    rpcUrl: 'https://kava-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/kava',
    derivationPath: "m/44'/459'/0'/0/0",
    addressPrefix: 'kava',
  },
  secret: {
    id: 'secret',
    name: 'Secret Network',
    symbol: 'SCRT',
    slip44: 529,
    type: 'cosmos',
    decimals: 6,
    rpcUrl: 'https://rpc.secret.express',
    explorerUrl: 'https://www.mintscan.io/secret',
    derivationPath: "m/44'/529'/0'/0/0",
    addressPrefix: 'secret',
  },
  sei: {
    id: 'sei',
    name: 'Sei',
    symbol: 'SEI',
    slip44: 118,
    type: 'cosmos',
    decimals: 6,
    rpcUrl: 'https://sei-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/sei',
    derivationPath: "m/44'/118'/0'/0/0",
    addressPrefix: 'sei',
  },
  celestia: {
    id: 'celestia',
    name: 'Celestia',
    symbol: 'TIA',
    slip44: 118,
    type: 'cosmos',
    decimals: 6,
    rpcUrl: 'https://celestia-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/celestia',
    derivationPath: "m/44'/118'/0'/0/0",
    addressPrefix: 'celestia',
  },
  injective: {
    id: 'injective',
    name: 'Injective',
    symbol: 'INJ',
    slip44: 60,
    type: 'cosmos',
    decimals: 18,
    rpcUrl: 'https://injective-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/injective',
    derivationPath: "m/44'/60'/0'/0/0",
    addressPrefix: 'inj',
  },

  // Polkadot Ecosystem
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    slip44: 354,
    type: 'polkadot',
    decimals: 10,
    rpcUrl: 'wss://rpc.polkadot.io',
    explorerUrl: 'https://polkadot.subscan.io',
    derivationPath: "m/44'/354'/0'/0/0",
  },
  kusama: {
    id: 'kusama',
    name: 'Kusama',
    symbol: 'KSM',
    slip44: 434,
    type: 'polkadot',
    decimals: 12,
    rpcUrl: 'wss://kusama-rpc.polkadot.io',
    explorerUrl: 'https://kusama.subscan.io',
    derivationPath: "m/44'/434'/0'/0/0",
  },

  // Tron
  tron: {
    id: 'tron',
    name: 'Tron',
    symbol: 'TRX',
    slip44: 195,
    type: 'tron',
    decimals: 6,
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    derivationPath: "m/44'/195'/0'/0/0",
  },

  // XRP
  xrp: {
    id: 'xrp',
    name: 'XRP Ledger',
    symbol: 'XRP',
    slip44: 144,
    type: 'xrp',
    decimals: 6,
    rpcUrl: 'wss://xrplcluster.com',
    explorerUrl: 'https://xrpscan.com',
    derivationPath: "m/44'/144'/0'/0/0",
  },

  // Cardano
  cardano: {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    slip44: 1815,
    type: 'cardano',
    decimals: 6,
    explorerUrl: 'https://cardanoscan.io',
    derivationPath: "m/1852'/1815'/0'/0/0",
  },

  // Near
  near: {
    id: 'near',
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    slip44: 397,
    type: 'near',
    decimals: 24,
    rpcUrl: 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://explorer.near.org',
    derivationPath: "m/44'/397'/0'",
  },

  // Aptos
  aptos: {
    id: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    slip44: 637,
    type: 'aptos',
    decimals: 8,
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    explorerUrl: 'https://explorer.aptoslabs.com',
    derivationPath: "m/44'/637'/0'/0'/0'",
  },

  // Sui
  sui: {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    slip44: 784,
    type: 'sui',
    decimals: 9,
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    explorerUrl: 'https://suiexplorer.com',
    derivationPath: "m/44'/784'/0'/0'/0'",
  },

  // Algorand
  algorand: {
    id: 'algorand',
    name: 'Algorand',
    symbol: 'ALGO',
    slip44: 283,
    type: 'other',
    decimals: 6,
    rpcUrl: 'https://mainnet-api.algonode.cloud',
    explorerUrl: 'https://algoexplorer.io',
    derivationPath: "m/44'/283'/0'/0/0",
  },

  // Stellar
  stellar: {
    id: 'stellar',
    name: 'Stellar',
    symbol: 'XLM',
    slip44: 148,
    type: 'other',
    decimals: 7,
    rpcUrl: 'https://horizon.stellar.org',
    explorerUrl: 'https://stellarchain.io',
    derivationPath: "m/44'/148'/0'",
  },

  // Hedera
  hedera: {
    id: 'hedera',
    name: 'Hedera',
    symbol: 'HBAR',
    slip44: 3030,
    type: 'other',
    decimals: 8,
    rpcUrl: 'https://mainnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io',
    derivationPath: "m/44'/3030'/0'/0/0",
  },

  // Filecoin
  filecoin: {
    id: 'filecoin',
    name: 'Filecoin',
    symbol: 'FIL',
    slip44: 461,
    type: 'other',
    decimals: 18,
    rpcUrl: 'https://api.node.glif.io',
    explorerUrl: 'https://filfox.info/en',
    derivationPath: "m/44'/461'/0'/0/0",
  },

  // VeChain
  vechain: {
    id: 'vechain',
    name: 'VeChain',
    symbol: 'VET',
    slip44: 818,
    type: 'other',
    decimals: 18,
    rpcUrl: 'https://mainnet.veblocks.net',
    explorerUrl: 'https://vechainstats.com',
    derivationPath: "m/44'/818'/0'/0/0",
  },
};

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): string[] {
  return Object.keys(SUPPORTED_CHAINS);
}

/**
 * Get chain configuration by ID
 */
export function getChainConfig(chainId: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

/**
 * Get all EVM chains
 */
export function getEvmChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter((chain) => chain.type === 'evm');
}

/**
 * Get all Cosmos chains
 */
export function getCosmosChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter((chain) => chain.type === 'cosmos');
}

/**
 * Get chain by EVM chain ID
 */
export function getChainByEvmChainId(evmChainId: number): ChainConfig | undefined {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.chainId === evmChainId);
}

/**
 * Chain type options for n8n dropdowns
 */
export const CHAIN_TYPE_OPTIONS = [
  { name: 'EVM', value: 'evm' },
  { name: 'Bitcoin', value: 'bitcoin' },
  { name: 'Solana', value: 'solana' },
  { name: 'Cosmos', value: 'cosmos' },
  { name: 'Polkadot', value: 'polkadot' },
  { name: 'Tron', value: 'tron' },
  { name: 'XRP', value: 'xrp' },
  { name: 'Cardano', value: 'cardano' },
  { name: 'Near', value: 'near' },
  { name: 'Aptos', value: 'aptos' },
  { name: 'Sui', value: 'sui' },
  { name: 'Other', value: 'other' },
];

/**
 * Alias for backward compatibility
 */
export const CHAIN_CONFIGS = SUPPORTED_CHAINS;
