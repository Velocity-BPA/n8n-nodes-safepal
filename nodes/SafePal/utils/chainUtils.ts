/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal Chain Utilities
 *
 * Functions for working with different blockchain networks.
 */

import { ethers } from 'ethers';
import {
  SUPPORTED_CHAINS,
  type ChainConfig,
  getChainConfig,
  getEvmChains,
} from '../constants/chains';
import { getDerivationPath } from '../constants/derivationPaths';

/**
 * Transaction types
 */
export interface UnsignedTransaction {
  chain: string;
  type: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId?: number;
}

export interface SignedTransaction {
  chain: string;
  rawTransaction: string;
  hash: string;
  signature: {
    r: string;
    s: string;
    v: number;
  };
}

/**
 * Format amount for display with chain decimals
 */
export function formatAmount(amount: string, chain: string): string {
  const config = getChainConfig(chain);
  if (!config) {
    return amount;
  }

  return formatAmountWithDecimals(amount, config.decimals, config.symbol);
}

/**
 * Format amount with specific decimals
 */
export function formatAmountWithDecimals(amount: string, decimals: number, symbol?: string): string {
  try {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholePart = value / divisor;
    const fractionalPart = value % divisor;

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');

    const formatted = trimmedFractional === '' 
      ? wholePart.toString()
      : `${wholePart}.${trimmedFractional}`;
    
    return symbol ? `${formatted} ${symbol}` : formatted;
  } catch {
    return symbol ? `${amount} ${symbol}` : amount;
  }
}

/**
 * Parse amount from human-readable to chain units
 */
export function parseAmount(amount: string, chain: string): string {
  const config = getChainConfig(chain);
  if (!config) {
    throw new Error(`Unknown chain: ${chain}`);
  }

  return parseAmountWithDecimals(amount, config.decimals);
}

/**
 * Parse amount with specific decimals
 */
export function parseAmountWithDecimals(amount: string, decimals: number): string {
  try {
    const [whole, fractional = ''] = amount.split('.');
    const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
    const combined = whole + paddedFractional;
    return BigInt(combined).toString();
  } catch {
    throw new Error(`Invalid amount format: ${amount}`);
  }
}

/**
 * Get chain provider URL
 */
export function getChainRpcUrl(chain: string, testnet: boolean = false): string | undefined {
  const config = getChainConfig(chain);
  if (!config) {
    return undefined;
  }
  return testnet ? config.testnetRpcUrl : config.rpcUrl;
}

/**
 * Get chain explorer URL for transaction
 */
export function getTransactionExplorerUrl(
  chain: string,
  txHash: string,
  testnet: boolean = false,
): string | undefined {
  const config = getChainConfig(chain);
  if (!config) {
    return undefined;
  }
  const baseUrl = testnet ? config.testnetExplorerUrl : config.explorerUrl;
  if (!baseUrl) {
    return undefined;
  }
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get chain explorer URL for address
 */
export function getAddressExplorerUrl(
  chain: string,
  address: string,
  testnet: boolean = false,
): string | undefined {
  const config = getChainConfig(chain);
  if (!config) {
    return undefined;
  }
  const baseUrl = testnet ? config.testnetExplorerUrl : config.explorerUrl;
  if (!baseUrl) {
    return undefined;
  }
  return `${baseUrl}/address/${address}`;
}

/**
 * Create unsigned EVM transaction
 */
export function createEvmTransaction(params: {
  to: string;
  value: string;
  data?: string;
  nonce?: number;
  gasLimit?: string;
  chainId: number;
  type?: 'legacy' | 'eip1559';
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}): ethers.TransactionRequest {
  const tx: ethers.TransactionRequest = {
    to: params.to,
    value: ethers.parseEther(params.value),
    chainId: params.chainId,
  };

  if (params.data) {
    tx.data = params.data;
  }
  if (params.nonce !== undefined) {
    tx.nonce = params.nonce;
  }
  if (params.gasLimit) {
    tx.gasLimit = BigInt(params.gasLimit);
  }

  if (params.type === 'legacy' || params.gasPrice) {
    tx.gasPrice = params.gasPrice ? BigInt(params.gasPrice) : undefined;
  } else {
    if (params.maxFeePerGas) {
      tx.maxFeePerGas = BigInt(params.maxFeePerGas);
    }
    if (params.maxPriorityFeePerGas) {
      tx.maxPriorityFeePerGas = BigInt(params.maxPriorityFeePerGas);
    }
  }

  return tx;
}

/**
 * Serialize EVM transaction for signing
 */
export function serializeEvmTransaction(tx: ethers.TransactionRequest): string {
  // Convert TransactionRequest to TransactionLike for serialization
  const txLike: ethers.TransactionLike = {
    to: tx.to as string | null,
    value: tx.value,
    data: tx.data as string | undefined,
    nonce: tx.nonce as number | undefined,
    gasLimit: tx.gasLimit,
    gasPrice: tx.gasPrice,
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
    chainId: tx.chainId as number | undefined,
    type: tx.type as number | undefined,
  };
  return ethers.Transaction.from(txLike).unsignedSerialized;
}

/**
 * Parse signed EVM transaction
 */
export function parseSignedEvmTransaction(signedTx: string): ethers.TransactionResponse | null {
  try {
    const tx = ethers.Transaction.from(signedTx);
    return tx as unknown as ethers.TransactionResponse;
  } catch {
    return null;
  }
}

/**
 * Get chain info for n8n display
 */
export function getChainDisplayInfo(chain: string): {
  name: string;
  symbol: string;
  type: string;
  chainId?: number;
} | null {
  const config = getChainConfig(chain);
  if (!config) {
    return null;
  }
  return {
    name: config.name,
    symbol: config.symbol,
    type: config.type,
    chainId: config.chainId,
  };
}

/**
 * Get all supported chain options for n8n dropdown
 */
export function getChainOptions(): Array<{ name: string; value: string }> {
  return Object.entries(SUPPORTED_CHAINS).map(([id, config]) => ({
    name: `${config.name} (${config.symbol})`,
    value: id,
  }));
}

/**
 * Get EVM chain options for n8n dropdown
 */
export function getEvmChainOptions(): Array<{ name: string; value: string }> {
  return getEvmChains().map((config) => ({
    name: `${config.name} (${config.symbol})`,
    value: config.id,
  }));
}

/**
 * Check if chain is EVM compatible
 */
export function isEvmChain(chain: string): boolean {
  const config = getChainConfig(chain);
  return config?.type === 'evm';
}

/**
 * Get derivation path for chain and account
 */
export function getChainDerivationPath(
  chain: string,
  account: number = 0,
  addressIndex: number = 0,
): string {
  const basePath = getDerivationPath(chain);
  // Replace account and address index in path
  return basePath
    .replace(/\/0'\/0\/0$/, `/${account}'/0/${addressIndex}`)
    .replace(/\/0'\/0'$/, `/${account}'/${addressIndex}'`);
}

/**
 * Validate chain ID
 */
export function validateChainId(chainId: string): boolean {
  return chainId in SUPPORTED_CHAINS;
}

/**
 * Get chain by symbol
 */
export function getChainBySymbol(symbol: string): ChainConfig | undefined {
  return Object.values(SUPPORTED_CHAINS).find(
    (chain) => chain.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

/**
 * Calculate gas estimate for EVM transaction
 */
export async function estimateEvmGas(
  provider: ethers.Provider,
  tx: ethers.TransactionRequest,
): Promise<bigint> {
  try {
    const estimate = await provider.estimateGas(tx);
    // Add 20% buffer
    return (estimate * 120n) / 100n;
  } catch {
    // Default gas limit
    return 21000n;
  }
}

/**
 * Get current gas prices for EVM chain
 */
export async function getEvmGasPrices(
  provider: ethers.Provider,
): Promise<{
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}> {
  try {
    const feeData = await provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice ?? undefined,
      maxFeePerGas: feeData.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}
