/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal Address Utilities
 *
 * Functions for validating and formatting blockchain addresses.
 */

import { ethers } from 'ethers';
import * as bs58 from 'bs58';
import { getChainConfig } from '../constants/chains';

/**
 * Address validation result
 */
export interface AddressValidation {
  valid: boolean;
  checksumValid?: boolean;
  error?: string;
  normalizedAddress?: string;
}

/**
 * Validate Ethereum/EVM address
 */
export function validateEvmAddress(address: string): AddressValidation {
  if (!address) {
    return { valid: false, error: 'Address is required' };
  }

  if (!address.startsWith('0x')) {
    return { valid: false, error: 'EVM address must start with 0x' };
  }

  if (address.length !== 42) {
    return { valid: false, error: 'EVM address must be 42 characters' };
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { valid: false, error: 'Invalid EVM address format' };
  }

  try {
    // Convert to lowercase first to avoid checksum validation errors
    const lowerAddress = address.toLowerCase();
    const checksumAddress = ethers.getAddress(lowerAddress);
    return {
      valid: true,
      checksumValid: address === checksumAddress,
      normalizedAddress: checksumAddress,
    };
  } catch {
    return { valid: false, error: 'Invalid EVM address' };
  }
}

/**
 * Validate Bitcoin address (supports legacy, segwit, native segwit, taproot)
 */
export function validateBitcoinAddress(address: string): AddressValidation {
  if (!address) {
    return { valid: false, error: 'Address is required' };
  }

  // Legacy addresses (P2PKH) - start with 1
  if (address.startsWith('1')) {
    if (address.length < 26 || address.length > 35) {
      return { valid: false, error: 'Invalid legacy address length' };
    }
    try {
      bs58.decode(address);
      return { valid: true, normalizedAddress: address };
    } catch {
      return { valid: false, error: 'Invalid legacy address encoding' };
    }
  }

  // P2SH addresses (SegWit compatible) - start with 3
  if (address.startsWith('3')) {
    if (address.length < 26 || address.length > 35) {
      return { valid: false, error: 'Invalid P2SH address length' };
    }
    try {
      bs58.decode(address);
      return { valid: true, normalizedAddress: address };
    } catch {
      return { valid: false, error: 'Invalid P2SH address encoding' };
    }
  }

  // Native SegWit addresses (Bech32) - start with bc1q
  if (address.startsWith('bc1q')) {
    if (address.length !== 42 && address.length !== 62) {
      return { valid: false, error: 'Invalid native SegWit address length' };
    }
    if (!/^bc1q[a-z0-9]{38,58}$/.test(address)) {
      return { valid: false, error: 'Invalid native SegWit address format' };
    }
    return { valid: true, normalizedAddress: address.toLowerCase() };
  }

  // Taproot addresses (Bech32m) - start with bc1p
  if (address.startsWith('bc1p')) {
    if (address.length !== 62) {
      return { valid: false, error: 'Invalid Taproot address length' };
    }
    if (!/^bc1p[a-z0-9]{58}$/.test(address)) {
      return { valid: false, error: 'Invalid Taproot address format' };
    }
    return { valid: true, normalizedAddress: address.toLowerCase() };
  }

  // Testnet addresses
  if (address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
    return { valid: true, normalizedAddress: address };
  }

  return { valid: false, error: 'Unrecognized Bitcoin address format' };
}

/**
 * Validate Solana address
 */
export function validateSolanaAddress(address: string): AddressValidation {
  if (!address) {
    return { valid: false, error: 'Address is required' };
  }

  if (address.length < 32 || address.length > 44) {
    return { valid: false, error: 'Invalid Solana address length' };
  }

  try {
    const decoded = bs58.decode(address);
    if (decoded.length !== 32) {
      return { valid: false, error: 'Invalid Solana address: decoded length must be 32 bytes' };
    }
    return { valid: true, normalizedAddress: address };
  } catch {
    return { valid: false, error: 'Invalid Solana address encoding' };
  }
}

/**
 * Validate Cosmos address
 */
export function validateCosmosAddress(address: string, prefix?: string): AddressValidation {
  if (!address) {
    return { valid: false, error: 'Address is required' };
  }

  // Common Cosmos prefixes
  const cosmosPrefix = prefix ?? 'cosmos';
  const prefixPattern = new RegExp(`^${cosmosPrefix}1[a-z0-9]{38,58}$`);

  if (!prefixPattern.test(address)) {
    return { valid: false, error: `Invalid Cosmos address format for prefix ${cosmosPrefix}` };
  }

  return { valid: true, normalizedAddress: address.toLowerCase() };
}

/**
 * Validate Tron address
 */
export function validateTronAddress(address: string): AddressValidation {
  if (!address) {
    return { valid: false, error: 'Address is required' };
  }

  if (!address.startsWith('T')) {
    return { valid: false, error: 'Tron address must start with T' };
  }

  if (address.length !== 34) {
    return { valid: false, error: 'Invalid Tron address length' };
  }

  try {
    bs58.decode(address);
    return { valid: true, normalizedAddress: address };
  } catch {
    return { valid: false, error: 'Invalid Tron address encoding' };
  }
}

/**
 * Validate XRP address
 */
export function validateXrpAddress(address: string): AddressValidation {
  if (!address) {
    return { valid: false, error: 'Address is required' };
  }

  if (!address.startsWith('r')) {
    return { valid: false, error: 'XRP address must start with r' };
  }

  if (address.length < 25 || address.length > 35) {
    return { valid: false, error: 'Invalid XRP address length' };
  }

  // XRP uses modified base58 (ripple alphabet)
  const rippleAlphabet = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
  for (const char of address) {
    if (!rippleAlphabet.includes(char)) {
      return { valid: false, error: 'Invalid XRP address character' };
    }
  }

  return { valid: true, normalizedAddress: address };
}

/**
 * Check if address is valid (boolean helper)
 */
export function isValidAddress(address: string, chain: string): boolean {
  const result = validateAddress(address, chain);
  return result.valid;
}

/**
 * Validate address for any supported chain
 */
export function validateAddress(address: string, chain: string): AddressValidation {
  const config = getChainConfig(chain);
  if (!config) {
    return { valid: false, error: `Unknown chain: ${chain}` };
  }

  switch (config.type) {
    case 'evm':
      return validateEvmAddress(address);
    case 'bitcoin':
      return validateBitcoinAddress(address);
    case 'solana':
      return validateSolanaAddress(address);
    case 'cosmos':
      return validateCosmosAddress(address, config.addressPrefix);
    case 'tron':
      return validateTronAddress(address);
    case 'xrp':
      return validateXrpAddress(address);
    default:
      // Basic validation for other chains
      if (address.length < 10 || address.length > 100) {
        return { valid: false, error: 'Invalid address length' };
      }
      return { valid: true, normalizedAddress: address };
  }
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddressDisplay(address: string, prefixLength: number = 6, suffixLength: number = 4): string {
  if (address.length <= prefixLength + suffixLength + 3) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Convert EVM address to checksum format
 */
export function toChecksumAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch {
    return address;
  }
}

/**
 * Check if address is zero address
 */
export function isZeroAddress(address: string): boolean {
  const zeroAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x0',
    '0',
    '',
  ];
  return zeroAddresses.includes(address.toLowerCase());
}

/**
 * Check if address is contract (for EVM)
 */
export async function isContractAddress(
  address: string,
  provider: ethers.Provider,
): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    return code !== '0x' && code !== '0x0';
  } catch {
    return false;
  }
}

/**
 * Generate address derivation info
 */
export function getAddressDerivationInfo(chain: string, path: string): {
  chain: string;
  path: string;
  coinType: number;
  account: number;
  change: number;
  addressIndex: number;
} {
  const parts = path.replace('m/', '').split('/');
  const parseIndex = (part: string): number => parseInt(part.replace("'", ''), 10);

  const config = getChainConfig(chain);

  return {
    chain,
    path,
    coinType: config?.slip44 ?? parseIndex(parts[1] ?? '0'),
    account: parseIndex(parts[2] ?? '0'),
    change: parseIndex(parts[3] ?? '0'),
    addressIndex: parseIndex(parts[4] ?? '0'),
  };
}
