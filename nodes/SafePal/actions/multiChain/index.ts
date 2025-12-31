/**
 * SafePal Multi-Chain Operations
 * Cross-chain and portfolio management operations
 * 
 * SPDX-License-Identifier: BSL-1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { CHAIN_CONFIGS, getSupportedChainIds, getChainConfig } from '../../constants/chains';
import { getChainOptions, formatAmountWithDecimals, parseAmountWithDecimals } from '../../utils/chainUtils';
import { validateAddress } from '../../utils/addressUtils';
import { createQrHandler } from '../../transport/qrHandler';

export const multiChainOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['multiChain'],
			},
		},
		options: [
			{
				name: 'Get Portfolio Balance',
				value: 'getPortfolioBalance',
				description: 'Get balances across multiple chains',
				action: 'Get portfolio balance across chains',
			},
			{
				name: 'Get All Addresses',
				value: 'getAllAddresses',
				description: 'Get addresses for all supported chains',
				action: 'Get addresses for all chains',
			},
			{
				name: 'Validate Multi-Chain Address',
				value: 'validateMultiChainAddress',
				description: 'Validate an address across multiple chain types',
				action: 'Validate address across chains',
			},
			{
				name: 'Get Chain Support',
				value: 'getChainSupport',
				description: 'Get list of supported chains and their features',
				action: 'Get supported chains',
			},
			{
				name: 'Create Multi-Chain Transaction',
				value: 'createMultiChainTransaction',
				description: 'Create a transaction for any supported chain',
				action: 'Create multi-chain transaction',
			},
			{
				name: 'Batch Get Balances',
				value: 'batchGetBalances',
				description: 'Get balances for multiple addresses on multiple chains',
				action: 'Batch get balances',
			},
			{
				name: 'Get Chain Groups',
				value: 'getChainGroups',
				description: 'Get chains grouped by type (EVM, Cosmos, etc.)',
				action: 'Get chain groups',
			},
			{
				name: 'Compare Chain Fees',
				value: 'compareChainFees',
				description: 'Compare transaction fees across chains',
				action: 'Compare chain fees',
			},
			{
				name: 'Generate Sync QR',
				value: 'generateSyncQr',
				description: 'Generate QR for multi-chain account sync',
				action: 'Generate sync QR code',
			},
			{
				name: 'Parse Portfolio Data',
				value: 'parsePortfolioData',
				description: 'Parse and aggregate portfolio data from multiple sources',
				action: 'Parse portfolio data',
			},
		],
		default: 'getPortfolioBalance',
	},
];

export const multiChainFields: INodeProperties[] = [
	// Chain selection for multi-chain operations
	{
		displayName: 'Chains',
		name: 'chains',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['getPortfolioBalance', 'getAllAddresses', 'batchGetBalances', 'compareChainFees'],
			},
		},
		options: getChainOptions(),
		default: ['ethereum', 'bitcoin', 'solana'],
		description: 'Select chains to include',
	},
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['createMultiChainTransaction'],
			},
		},
		options: getChainOptions(),
		default: 'ethereum',
		description: 'Chain for the transaction',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['validateMultiChainAddress', 'getPortfolioBalance', 'getAllAddresses'],
			},
		},
		default: '',
		placeholder: '0x... or bc1... or account address',
		description: 'Address to validate or query',
	},
	{
		displayName: 'Addresses',
		name: 'addresses',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['batchGetBalances'],
			},
		},
		default: '[\n  {"chain": "ethereum", "address": "0x..."},\n  {"chain": "bitcoin", "address": "bc1..."}\n]',
		description: 'JSON array of chain/address pairs',
	},
	// Transaction parameters
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['createMultiChainTransaction'],
			},
		},
		default: '',
		description: 'Recipient address',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['createMultiChainTransaction'],
			},
		},
		default: '',
		description: 'Amount to send (in native units)',
	},
	// Portfolio data
	{
		displayName: 'Portfolio Data',
		name: 'portfolioData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['parsePortfolioData'],
			},
		},
		default: '{}',
		description: 'Raw portfolio data to parse',
	},
	// Sync options
	{
		displayName: 'Include Tokens',
		name: 'includeTokens',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['generateSyncQr', 'getPortfolioBalance'],
			},
		},
		default: true,
		description: 'Whether to include token balances',
	},
	// Filter options
	{
		displayName: 'Chain Type Filter',
		name: 'chainTypeFilter',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['getChainSupport', 'getChainGroups'],
			},
		},
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'EVM', value: 'evm' },
			{ name: 'Bitcoin Family', value: 'bitcoin' },
			{ name: 'Cosmos Ecosystem', value: 'cosmos' },
			{ name: 'Solana', value: 'solana' },
			{ name: 'Polkadot Ecosystem', value: 'polkadot' },
			{ name: 'Other', value: 'other' },
		],
		default: 'all',
		description: 'Filter chains by type',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['multiChain'],
				operation: ['getAllAddresses', 'generateSyncQr'],
			},
		},
		default: 0,
		description: 'Account index for derivation',
	},
];

export async function executeMultiChain(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const qrHandler = createQrHandler();
	
	switch (operation) {
		case 'getPortfolioBalance': {
			const chains = this.getNodeParameter('chains', index) as string[];
			const address = this.getNodeParameter('address', index, '') as string;
			const includeTokens = this.getNodeParameter('includeTokens', index, true) as boolean;
			
			const portfolio: Array<{
				chain: string;
				chainId: string;
				symbol: string;
				balance: string;
				balanceFormatted: string;
				usdValue?: string;
				tokens?: Array<{
					symbol: string;
					balance: string;
					contractAddress?: string;
				}>;
			}> = [];
			
			let totalUsdValue = 0;
			
			for (const chainId of chains) {
				const chainConfig = getChainConfig(chainId);
				if (!chainConfig) continue;
				
				// In production, this would query actual RPC endpoints
				// For now, return structure for integration
				const chainBalance = {
					chain: chainConfig.name,
					chainId: chainConfig.id,
					symbol: chainConfig.symbol,
					balance: '0',
					balanceFormatted: formatAmountWithDecimals('0', chainConfig.decimals),
					tokens: includeTokens ? [] : undefined,
				};
				
				portfolio.push(chainBalance);
			}
			
			return [{
				json: {
					success: true,
					portfolio,
					totalChains: portfolio.length,
					totalUsdValue: totalUsdValue.toFixed(2),
					includeTokens,
					queriedAddress: address || 'all',
					timestamp: new Date().toISOString(),
				},
			}];
		}
		
		case 'getAllAddresses': {
			const chains = this.getNodeParameter('chains', index) as string[];
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			const addresses: Array<{
				chain: string;
				chainId: string;
				derivationPath: string;
				address: string;
				addressType?: string;
			}> = [];
			
			for (const chainId of chains) {
				const chainConfig = getChainConfig(chainId);
				if (!chainConfig) continue;
				
				// Build derivation path
				const path = chainConfig.derivationPath.replace('/0/0', `/${accountIndex}/0`);
				
				addresses.push({
					chain: chainConfig.name,
					chainId: chainConfig.id,
					derivationPath: path,
					address: `[Derive from device for ${chainConfig.name}]`,
					addressType: chainConfig.type,
				});
			}
			
			// Generate QR for device to derive all addresses
			const syncData = {
				action: 'derive_addresses',
				chains: chains,
				accountIndex,
				timestamp: Date.now(),
			};
			
			const qrCode = await qrHandler.generateSyncQr(syncData);
			
			return [{
				json: {
					success: true,
					addresses,
					totalChains: addresses.length,
					accountIndex,
					syncQrCode: qrCode,
					instructions: 'Scan QR code with SafePal device to derive all addresses',
				},
			}];
		}
		
		case 'validateMultiChainAddress': {
			const address = this.getNodeParameter('address', index) as string;
			
			const validationResults: Array<{
				chainType: string;
				isValid: boolean;
				matchingChains: string[];
			}> = [];
			
			// Check against all chain types
			const chainTypes = ['evm', 'bitcoin', 'solana', 'cosmos', 'tron', 'xrp', 'polkadot'];
			
			for (const chainType of chainTypes) {
				// Find a chain of this type to test against
				const chainId = Object.keys(CHAIN_CONFIGS).find(
					id => CHAIN_CONFIGS[id].type === chainType
				);
				
				if (chainId) {
					const isValid = validateAddress(address, chainId);
					if (isValid) {
						const matchingChains = Object.values(CHAIN_CONFIGS)
							.filter(c => c.type === chainType)
							.map(c => c.name);
						
						validationResults.push({
							chainType,
							isValid: true,
							matchingChains,
						});
					}
				}
			}
			
			return [{
				json: {
					success: true,
					address,
					isValidForAnyChain: validationResults.length > 0,
					validationResults,
					detectedTypes: validationResults.map(r => r.chainType),
				},
			}];
		}
		
		case 'getChainSupport': {
			const chainTypeFilter = this.getNodeParameter('chainTypeFilter', index, 'all') as string;
			
			let chains = Object.values(CHAIN_CONFIGS);
			
			if (chainTypeFilter !== 'all') {
				chains = chains.filter(c => c.type === chainTypeFilter);
			}
			
			const chainSupport = chains.map(chain => ({
				id: chain.id,
				name: chain.name,
				symbol: chain.symbol,
				type: chain.type,
				chainId: chain.chainId,
				decimals: chain.decimals,
				hasRpcUrl: !!chain.rpcUrl,
				hasExplorer: !!chain.explorerUrl,
				derivationPath: chain.derivationPath,
				features: {
					supportsEip1559: chain.type === 'evm',
					supportsStaking: ['cosmos', 'polkadot', 'solana', 'near', 'aptos', 'sui'].includes(chain.type),
					supportsTokens: ['evm', 'solana', 'tron', 'cosmos'].includes(chain.type),
					supportsNft: ['evm', 'solana'].includes(chain.type),
				},
			}));
			
			return [{
				json: {
					success: true,
					totalChains: chainSupport.length,
					filter: chainTypeFilter,
					chains: chainSupport,
				},
			}];
		}
		
		case 'createMultiChainTransaction': {
			const chain = this.getNodeParameter('chain', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			const chainConfig = getChainConfig(chain);
			if (!chainConfig) {
				throw new Error(`Unsupported chain: ${chain}`);
			}
			
			// Validate recipient address
			if (!validateAddress(toAddress, chain)) {
				throw new Error(`Invalid ${chainConfig.name} address: ${toAddress}`);
			}
			
			const amountInSmallestUnit = parseAmountWithDecimals(amount, chainConfig.decimals);
			
			// Build chain-appropriate transaction structure
			let transaction: Record<string, unknown>;
			
			switch (chainConfig.type) {
				case 'evm':
					transaction = {
						to: toAddress,
						value: amountInSmallestUnit,
						chainId: chainConfig.chainId,
						type: 2, // EIP-1559
					};
					break;
				
				case 'bitcoin':
					transaction = {
						outputs: [{ address: toAddress, value: amountInSmallestUnit }],
						network: 'mainnet',
					};
					break;
				
				case 'solana':
					transaction = {
						recipient: toAddress,
						lamports: amountInSmallestUnit,
					};
					break;
				
				case 'cosmos':
					transaction = {
						messages: [{
							type: 'cosmos-sdk/MsgSend',
							value: {
								to_address: toAddress,
								amount: [{ denom: chainConfig.symbol.toLowerCase(), amount: amountInSmallestUnit }],
							},
						}],
					};
					break;
				
				default:
					transaction = {
						to: toAddress,
						amount: amountInSmallestUnit,
						chain: chain,
					};
			}
			
			// Generate QR for signing
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				chainId: chainConfig.chainId,
				type: chainConfig.type,
				transaction,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					chainType: chainConfig.type,
					transaction,
					amount,
					amountInSmallestUnit,
					recipient: toAddress,
					qrCode,
					instructions: 'Scan QR code with SafePal device to sign transaction',
				},
			}];
		}
		
		case 'batchGetBalances': {
			const addressesJson = this.getNodeParameter('addresses', index) as string;
			let addresses: Array<{ chain: string; address: string }>;
			
			try {
				addresses = JSON.parse(addressesJson);
			} catch {
				throw new Error('Invalid JSON format for addresses');
			}
			
			const results: Array<{
				chain: string;
				address: string;
				isValidAddress: boolean;
				balance?: string;
				error?: string;
			}> = [];
			
			for (const item of addresses) {
				const chainConfig = getChainConfig(item.chain);
				if (!chainConfig) {
					results.push({
						chain: item.chain,
						address: item.address,
						isValidAddress: false,
						error: 'Unsupported chain',
					});
					continue;
				}
				
				const isValid = validateAddress(item.address, item.chain);
				if (!isValid) {
					results.push({
						chain: item.chain,
						address: item.address,
						isValidAddress: false,
						error: 'Invalid address format',
					});
					continue;
				}
				
				// In production, query actual balance
				results.push({
					chain: item.chain,
					address: item.address,
					isValidAddress: true,
					balance: '0', // Would query from RPC
				});
			}
			
			return [{
				json: {
					success: true,
					totalQueried: addresses.length,
					validAddresses: results.filter(r => r.isValidAddress).length,
					results,
				},
			}];
		}
		
		case 'getChainGroups': {
			const chainTypeFilter = this.getNodeParameter('chainTypeFilter', index, 'all') as string;
			
			const groups: Record<string, Array<{ id: string; name: string; symbol: string }>> = {};
			
			for (const chain of Object.values(CHAIN_CONFIGS)) {
				if (chainTypeFilter !== 'all' && chain.type !== chainTypeFilter) continue;
				
				if (!groups[chain.type]) {
					groups[chain.type] = [];
				}
				
				groups[chain.type].push({
					id: chain.id,
					name: chain.name,
					symbol: chain.symbol,
				});
			}
			
			// Sort groups by chain count
			const sortedGroups = Object.entries(groups)
				.sort((a, b) => b[1].length - a[1].length)
				.reduce((acc, [type, chains]) => {
					acc[type] = chains;
					return acc;
				}, {} as typeof groups);
			
			return [{
				json: {
					success: true,
					filter: chainTypeFilter,
					totalGroups: Object.keys(sortedGroups).length,
					totalChains: Object.values(sortedGroups).flat().length,
					groups: sortedGroups,
				},
			}];
		}
		
		case 'compareChainFees': {
			const chains = this.getNodeParameter('chains', index) as string[];
			
			const feeComparison: Array<{
				chain: string;
				symbol: string;
				type: string;
				estimatedFee: string;
				feeUnit: string;
				speedOptions?: {
					slow: string;
					standard: string;
					fast: string;
				};
			}> = [];
			
			for (const chainId of chains) {
				const chainConfig = getChainConfig(chainId);
				if (!chainConfig) continue;
				
				// Estimated fees (would query from RPC in production)
				let fee: string;
				let feeUnit: string;
				
				switch (chainConfig.type) {
					case 'evm':
						fee = '0.001';
						feeUnit = chainConfig.symbol;
						break;
					case 'bitcoin':
						fee = '0.00005';
						feeUnit = 'BTC';
						break;
					case 'solana':
						fee = '0.000005';
						feeUnit = 'SOL';
						break;
					case 'cosmos':
						fee = '0.005';
						feeUnit = chainConfig.symbol;
						break;
					default:
						fee = '0.001';
						feeUnit = chainConfig.symbol;
				}
				
				feeComparison.push({
					chain: chainConfig.name,
					symbol: chainConfig.symbol,
					type: chainConfig.type,
					estimatedFee: fee,
					feeUnit,
					speedOptions: chainConfig.type === 'evm' ? {
						slow: (parseFloat(fee) * 0.8).toFixed(6),
						standard: fee,
						fast: (parseFloat(fee) * 1.5).toFixed(6),
					} : undefined,
				});
			}
			
			// Sort by estimated fee
			feeComparison.sort((a, b) => parseFloat(a.estimatedFee) - parseFloat(b.estimatedFee));
			
			return [{
				json: {
					success: true,
					chainsCompared: feeComparison.length,
					lowestFee: feeComparison[0],
					highestFee: feeComparison[feeComparison.length - 1],
					comparison: feeComparison,
					note: 'Fee estimates are approximate and may vary based on network conditions',
				},
			}];
		}
		
		case 'generateSyncQr': {
			const chains = this.getNodeParameter('chains', index) as string[];
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const includeTokens = this.getNodeParameter('includeTokens', index, true) as boolean;
			
			const syncData = {
				action: 'full_sync',
				chains,
				accountIndex,
				includeTokens,
				timestamp: Date.now(),
				version: '1.0',
			};
			
			const qrCode = await qrHandler.generateSyncQr(syncData);
			
			return [{
				json: {
					success: true,
					syncData,
					qrCode,
					estimatedDataSize: JSON.stringify(syncData).length,
					instructions: 'Scan with SafePal device to sync account data',
				},
			}];
		}
		
		case 'parsePortfolioData': {
			const portfolioDataJson = this.getNodeParameter('portfolioData', index) as string;
			let portfolioData: Record<string, unknown>;
			
			try {
				portfolioData = JSON.parse(portfolioDataJson);
			} catch {
				throw new Error('Invalid JSON format for portfolio data');
			}
			
			// Parse and aggregate portfolio data
			const aggregated = {
				totalChains: 0,
				totalTokens: 0,
				chainBreakdown: [] as Array<{
					chain: string;
					nativeBalance: string;
					tokenCount: number;
				}>,
				topHoldings: [] as Array<{
					asset: string;
					chain: string;
					balance: string;
				}>,
			};
			
			// Process portfolio data structure
			if (Array.isArray(portfolioData)) {
				aggregated.totalChains = portfolioData.length;
				for (const item of portfolioData as Array<Record<string, unknown>>) {
					if (item.chain && typeof item.chain === 'string') {
						aggregated.chainBreakdown.push({
							chain: item.chain,
							nativeBalance: String(item.balance || '0'),
							tokenCount: Array.isArray(item.tokens) ? item.tokens.length : 0,
						});
						if (Array.isArray(item.tokens)) {
							aggregated.totalTokens += item.tokens.length;
						}
					}
				}
			}
			
			return [{
				json: {
					success: true,
					parsed: true,
					aggregated,
					rawDataSize: JSON.stringify(portfolioData).length,
				},
			}];
		}
		
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}

// Export for consistent module interface
export const description: INodeProperties[] = [...multiChainOperations, ...multiChainFields];
export const execute = executeMultiChain;
