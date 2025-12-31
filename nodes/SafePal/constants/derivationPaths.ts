/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal Derivation Path Constants
 *
 * BIP32/BIP44/BIP49/BIP84 derivation paths for supported blockchains.
 */

/**
 * Standard derivation path types
 */
export const DERIVATION_PATH_TYPES = {
  BIP44: 'bip44',
  BIP49: 'bip49',
  BIP84: 'bip84',
  BIP86: 'bip86',
  SLIP44: 'slip44',
} as const;

export type DerivationPathType = (typeof DERIVATION_PATH_TYPES)[keyof typeof DERIVATION_PATH_TYPES];

/**
 * Standard derivation path templates
 */
export const DERIVATION_TEMPLATES = {
  BIP44: "m/44'/{coinType}'/{account}'/{change}/{addressIndex}",
  BIP49: "m/49'/{coinType}'/{account}'/{change}/{addressIndex}",
  BIP84: "m/84'/{coinType}'/{account}'/{change}/{addressIndex}",
  BIP86: "m/86'/{coinType}'/{account}'/{change}/{addressIndex}",
  COSMOS: "m/44'/{coinType}'/{account}'/0/{addressIndex}",
  SOLANA: "m/44'/501'/{account}'/{addressIndex}'",
  NEAR: "m/44'/397'/{account}'",
  APTOS: "m/44'/637'/{account}'/{addressIndex}'/{keyIndex}'",
  SUI: "m/44'/784'/{account}'/{addressIndex}'/{keyIndex}'",
} as const;

/**
 * SLIP-44 coin types
 */
export const SLIP44_COIN_TYPES: Record<string, number> = {
  bitcoin: 0,
  testnet: 1,
  litecoin: 2,
  dogecoin: 3,
  dash: 5,
  ethereum: 60,
  cosmos: 118,
  xrp: 144,
  stellar: 148,
  tron: 195,
  algorand: 283,
  polkadot: 354,
  near: 397,
  kusama: 434,
  kava: 459,
  filecoin: 461,
  solana: 501,
  secret: 529,
  aptos: 637,
  sui: 784,
  vechain: 818,
  cardano: 1815,
  hedera: 3030,
};

/**
 * Default derivation paths for each chain
 */
export const DEFAULT_DERIVATION_PATHS: Record<string, string> = {
  // Bitcoin and similar
  bitcoin: "m/84'/0'/0'/0/0",
  bitcoinTestnet: "m/84'/1'/0'/0/0",
  bitcoinLegacy: "m/44'/0'/0'/0/0",
  bitcoinSegwit: "m/49'/0'/0'/0/0",
  litecoin: "m/84'/2'/0'/0/0",
  dogecoin: "m/44'/3'/0'/0/0",
  bitcoinCash: "m/44'/145'/0'/0/0",
  dash: "m/44'/5'/0'/0/0",
  zcash: "m/44'/133'/0'/0/0",

  // EVM chains (all use Ethereum's derivation)
  ethereum: "m/44'/60'/0'/0/0",
  binanceSmartChain: "m/44'/60'/0'/0/0",
  polygon: "m/44'/60'/0'/0/0",
  arbitrum: "m/44'/60'/0'/0/0",
  optimism: "m/44'/60'/0'/0/0",
  avalanche: "m/44'/60'/0'/0/0",
  fantom: "m/44'/60'/0'/0/0",
  cronos: "m/44'/60'/0'/0/0",
  gnosis: "m/44'/60'/0'/0/0",
  base: "m/44'/60'/0'/0/0",
  zkSync: "m/44'/60'/0'/0/0",
  linea: "m/44'/60'/0'/0/0",

  // Solana
  solana: "m/44'/501'/0'/0'",

  // Cosmos ecosystem
  cosmos: "m/44'/118'/0'/0/0",
  osmosis: "m/44'/118'/0'/0/0",
  juno: "m/44'/118'/0'/0/0",
  evmos: "m/44'/60'/0'/0/0",
  kava: "m/44'/459'/0'/0/0",
  secret: "m/44'/529'/0'/0/0",
  sei: "m/44'/118'/0'/0/0",
  celestia: "m/44'/118'/0'/0/0",
  injective: "m/44'/60'/0'/0/0",

  // Polkadot ecosystem
  polkadot: "m/44'/354'/0'/0/0",
  kusama: "m/44'/434'/0'/0/0",

  // Other chains
  tron: "m/44'/195'/0'/0/0",
  xrp: "m/44'/144'/0'/0/0",
  cardano: "m/1852'/1815'/0'/0/0",
  near: "m/44'/397'/0'",
  aptos: "m/44'/637'/0'/0'/0'",
  sui: "m/44'/784'/0'/0'/0'",
  algorand: "m/44'/283'/0'/0/0",
  stellar: "m/44'/148'/0'",
  hedera: "m/44'/3030'/0'/0/0",
  filecoin: "m/44'/461'/0'/0/0",
  vechain: "m/44'/818'/0'/0/0",
};

/**
 * Address types for Bitcoin
 */
export const BITCOIN_ADDRESS_TYPES = {
  LEGACY: 'legacy',
  SEGWIT: 'segwit',
  NATIVE_SEGWIT: 'native_segwit',
  TAPROOT: 'taproot',
} as const;

export type BitcoinAddressType =
  (typeof BITCOIN_ADDRESS_TYPES)[keyof typeof BITCOIN_ADDRESS_TYPES];

/**
 * Bitcoin address type options for n8n
 */
export const BITCOIN_ADDRESS_TYPE_OPTIONS = [
  { name: 'Native SegWit (bc1q...)', value: 'native_segwit' },
  { name: 'SegWit (3...)', value: 'segwit' },
  { name: 'Legacy (1...)', value: 'legacy' },
  { name: 'Taproot (bc1p...)', value: 'taproot' },
];

/**
 * Parse derivation path string to components
 */
export function parseDerivationPath(path: string): {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
  addressIndex: number;
} {
  const parts = path.replace('m/', '').split('/');
  const parseIndex = (part: string): number => {
    const cleaned = part.replace("'", '');
    return parseInt(cleaned, 10);
  };

  return {
    purpose: parseIndex(parts[0] ?? '44'),
    coinType: parseIndex(parts[1] ?? '0'),
    account: parseIndex(parts[2] ?? '0'),
    change: parseIndex(parts[3] ?? '0'),
    addressIndex: parseIndex(parts[4] ?? '0'),
  };
}

/**
 * Build derivation path from components
 */
export function buildDerivationPath(
  purpose: number,
  coinType: number,
  account: number = 0,
  change: number = 0,
  addressIndex: number = 0,
  hardened: boolean[] = [true, true, true, false, false],
): string {
  const h = (idx: number) => (hardened[idx] ? "'" : '');
  return `m/${purpose}${h(0)}/${coinType}${h(1)}/${account}${h(2)}/${change}${h(3)}/${addressIndex}${h(4)}`;
}

/**
 * Get derivation path for chain
 */
export function getDerivationPath(chainId: string): string {
  return DEFAULT_DERIVATION_PATHS[chainId] ?? DEFAULT_DERIVATION_PATHS.ethereum;
}

/**
 * Get SLIP-44 coin type for chain
 */
export function getCoinType(chainId: string): number {
  return SLIP44_COIN_TYPES[chainId] ?? SLIP44_COIN_TYPES.ethereum;
}

/**
 * Build derivation path for a specific chain with account and address indexes
 */
export function buildChainDerivationPath(
  chainId: string,
  accountIndex: number = 0,
  change: boolean = false,
  addressIndex: number = 0,
): string {
  const coinType = getCoinType(chainId);
  const purpose = 44; // BIP44 by default
  const changeIndex = change ? 1 : 0;
  return `m/${purpose}'/${coinType}'/${accountIndex}'/${changeIndex}/${addressIndex}`;
}
