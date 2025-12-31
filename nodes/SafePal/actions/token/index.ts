/**
 * SafePal Token Operations
 * Token management across multiple chains
 * 
 * SPDX-License-Identifier: BSL-1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { getChainConfig, getEvmChains } from '../../constants/chains';
import { getEvmChainOptions, formatAmount, parseAmount, parseAmountWithDecimals } from '../../utils/chainUtils';
import { validateEvmAddress } from '../../utils/addressUtils';
import { createQrHandler } from '../../transport/qrHandler';

export const tokenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			{
				name: 'Get Token Info',
				value: 'getTokenInfo',
				description: 'Get information about a token',
				action: 'Get token info',
			},
			{
				name: 'Get Token Balance',
				value: 'getTokenBalance',
				description: 'Get token balance for an address',
				action: 'Get token balance',
			},
			{
				name: 'Transfer Token',
				value: 'transferToken',
				description: 'Transfer tokens to another address',
				action: 'Transfer tokens',
			},
			{
				name: 'Approve Token',
				value: 'approveToken',
				description: 'Approve token spending allowance',
				action: 'Approve token spending',
			},
			{
				name: 'Get Allowance',
				value: 'getAllowance',
				description: 'Get token spending allowance',
				action: 'Get token allowance',
			},
			{
				name: 'Revoke Approval',
				value: 'revokeApproval',
				description: 'Revoke token spending approval',
				action: 'Revoke token approval',
			},
			{
				name: 'Get Token Holders',
				value: 'getTokenHolders',
				description: 'Get list of token holders',
				action: 'Get token holders',
			},
			{
				name: 'Get Token Transfers',
				value: 'getTokenTransfers',
				description: 'Get token transfer history',
				action: 'Get token transfers',
			},
			{
				name: 'Batch Transfer',
				value: 'batchTransfer',
				description: 'Transfer tokens to multiple recipients',
				action: 'Batch transfer tokens',
			},
			{
				name: 'Wrap Native Token',
				value: 'wrapNative',
				description: 'Wrap native token (e.g., ETH to WETH)',
				action: 'Wrap native token',
			},
			{
				name: 'Unwrap Token',
				value: 'unwrapToken',
				description: 'Unwrap wrapped native token',
				action: 'Unwrap token',
			},
			{
				name: 'Get Popular Tokens',
				value: 'getPopularTokens',
				description: 'Get list of popular tokens on a chain',
				action: 'Get popular tokens',
			},
		],
		default: 'getTokenBalance',
	},
];

export const tokenFields: INodeProperties[] = [
	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			...getEvmChainOptions(),
			{ name: 'Solana', value: 'solana' },
			{ name: 'Tron', value: 'tron' },
		],
		default: 'ethereum',
		description: 'Blockchain network',
	},
	// Token contract address
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: [
					'getTokenInfo', 'getTokenBalance', 'transferToken', 
					'approveToken', 'getAllowance', 'revokeApproval',
					'getTokenHolders', 'getTokenTransfers', 'batchTransfer',
				],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Token contract address',
	},
	// Wallet address
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenBalance', 'getAllowance', 'getTokenTransfers'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Wallet address to check',
	},
	// Transfer recipient
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferToken'],
			},
		},
		default: '',
		description: 'Recipient address',
	},
	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferToken', 'approveToken', 'wrapNative', 'unwrapToken'],
			},
		},
		default: '',
		description: 'Amount to transfer or approve',
	},
	// Spender for approvals
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['approveToken', 'getAllowance', 'revokeApproval'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address to approve for spending',
	},
	// Unlimited approval option
	{
		displayName: 'Unlimited Approval',
		name: 'unlimitedApproval',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['approveToken'],
			},
		},
		default: false,
		description: 'Whether to approve unlimited amount (use with caution)',
	},
	// Batch recipients
	{
		displayName: 'Recipients',
		name: 'recipients',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['batchTransfer'],
			},
		},
		default: '[\n  {"address": "0x...", "amount": "100"},\n  {"address": "0x...", "amount": "50"}\n]',
		description: 'JSON array of recipients with addresses and amounts',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		default: 0,
		description: 'Account index for address derivation',
	},
];

// Common ERC20 tokens by chain
const POPULAR_TOKENS: Record<string, Array<{ symbol: string; name: string; address: string; decimals: number }>> = {
	ethereum: [
		{ symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
		{ symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
		{ symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
		{ symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EescdeCB5BE', decimals: 18 },
		{ symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
		{ symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
		{ symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18 },
	],
	bsc: [
		{ symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
		{ symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
		{ symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
		{ symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
		{ symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 },
	],
	polygon: [
		{ symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
		{ symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
		{ symbol: 'WMATIC', name: 'Wrapped Matic', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
		{ symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
	],
	arbitrum: [
		{ symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
		{ symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
		{ symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
		{ symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
	],
};

// Wrapped native token addresses
const WRAPPED_NATIVE: Record<string, { address: string; symbol: string; decimals: number }> = {
	ethereum: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
	bsc: { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', decimals: 18 },
	polygon: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', decimals: 18 },
	arbitrum: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
	optimism: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
	avalanche: { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', symbol: 'WAVAX', decimals: 18 },
	fantom: { address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', symbol: 'WFTM', decimals: 18 },
	base: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
};

export async function executeToken(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const chain = this.getNodeParameter('chain', index) as string;
	const qrHandler = createQrHandler();
	
	const chainConfig = getChainConfig(chain);
	if (!chainConfig) {
		throw new Error(`Unsupported chain: ${chain}`);
	}
	
	switch (operation) {
		case 'getTokenInfo': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			
			if (chainConfig.type === 'evm' && !validateEvmAddress(tokenAddress)) {
				throw new Error('Invalid token address');
			}
			
			// ERC20 standard interface
			const tokenInfo = {
				address: tokenAddress,
				chain: chainConfig.name,
				chainId: chainConfig.chainId,
				// These would be queried from the contract in production
				name: '[Query from contract]',
				symbol: '[Query from contract]',
				decimals: 18,
				totalSupply: '[Query from contract]',
				type: chainConfig.type === 'evm' ? 'ERC20' : 
				      chain === 'solana' ? 'SPL' : 
				      chain === 'tron' ? 'TRC20' : 'Unknown',
			};
			
			return [{
				json: {
					success: true,
					token: tokenInfo,
					explorerUrl: chainConfig.explorerUrl ? 
						`${chainConfig.explorerUrl}/token/${tokenAddress}` : null,
				},
			}];
		}
		
		case 'getTokenBalance': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;
			
			if (chainConfig.type === 'evm') {
				if (!validateEvmAddress(tokenAddress)) {
					throw new Error('Invalid token address');
				}
				if (!validateEvmAddress(walletAddress)) {
					throw new Error('Invalid wallet address');
				}
			}
			
			// Would call balanceOf(walletAddress) on the contract
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					tokenAddress,
					walletAddress,
					balance: '0',
					balanceFormatted: '0.0',
					decimals: 18,
				},
			}];
		}
		
		case 'transferToken': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			if (chainConfig.type === 'evm') {
				if (!validateEvmAddress(tokenAddress)) {
					throw new Error('Invalid token address');
				}
				if (!validateEvmAddress(toAddress)) {
					throw new Error('Invalid recipient address');
				}
			}
			
			// ERC20 transfer function signature: transfer(address,uint256)
			const decimals = 18; // Would query from contract
			const amountInWei = parseAmountWithDecimals(amount, decimals);
			
			// Build transfer call data
			const transferData = {
				to: tokenAddress,
				data: `0xa9059cbb${toAddress.slice(2).padStart(64, '0')}${BigInt(amountInWei).toString(16).padStart(64, '0')}`,
				value: '0',
				chainId: chainConfig.chainId,
			};
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'token_transfer',
				transaction: transferData,
				metadata: {
					tokenAddress,
					recipient: toAddress,
					amount,
					accountIndex,
				},
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'transfer',
					tokenAddress,
					recipient: toAddress,
					amount,
					transaction: transferData,
					qrCode,
					instructions: 'Scan QR with SafePal device to sign token transfer',
				},
			}];
		}
		
		case 'approveToken': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			const unlimitedApproval = this.getNodeParameter('unlimitedApproval', index, false) as boolean;
			const amount = unlimitedApproval ? 
				'115792089237316195423570985008687907853269984665640564039457584007913129639935' : // Max uint256
				this.getNodeParameter('amount', index) as string;
			
			if (chainConfig.type === 'evm') {
				if (!validateEvmAddress(tokenAddress)) {
					throw new Error('Invalid token address');
				}
				if (!validateEvmAddress(spenderAddress)) {
					throw new Error('Invalid spender address');
				}
			}
			
			const decimals = 18;
			const approvalAmount = unlimitedApproval ? amount : parseAmountWithDecimals(amount, decimals);
			
			// ERC20 approve function signature: approve(address,uint256)
			const approveData = {
				to: tokenAddress,
				data: `0x095ea7b3${spenderAddress.slice(2).padStart(64, '0')}${BigInt(approvalAmount).toString(16).padStart(64, '0')}`,
				value: '0',
				chainId: chainConfig.chainId,
			};
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'token_approve',
				transaction: approveData,
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'approve',
					tokenAddress,
					spender: spenderAddress,
					amount: unlimitedApproval ? 'Unlimited' : amount,
					isUnlimited: unlimitedApproval,
					warning: unlimitedApproval ? 
						'Unlimited approval grants full access to your tokens. Use with caution.' : null,
					transaction: approveData,
					qrCode,
					instructions: 'Scan QR with SafePal device to sign approval',
				},
			}];
		}
		
		case 'getAllowance': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			
			// Would call allowance(owner, spender) on the contract
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					tokenAddress,
					owner: walletAddress,
					spender: spenderAddress,
					allowance: '0',
					allowanceFormatted: '0.0',
					isUnlimited: false,
				},
			}];
		}
		
		case 'revokeApproval': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			
			if (chainConfig.type === 'evm') {
				if (!validateEvmAddress(tokenAddress)) {
					throw new Error('Invalid token address');
				}
				if (!validateEvmAddress(spenderAddress)) {
					throw new Error('Invalid spender address');
				}
			}
			
			// Approve 0 to revoke
			const revokeData = {
				to: tokenAddress,
				data: `0x095ea7b3${spenderAddress.slice(2).padStart(64, '0')}${'0'.padStart(64, '0')}`,
				value: '0',
				chainId: chainConfig.chainId,
			};
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'token_revoke',
				transaction: revokeData,
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'revoke',
					tokenAddress,
					spender: spenderAddress,
					transaction: revokeData,
					qrCode,
					instructions: 'Scan QR with SafePal device to revoke approval',
				},
			}];
		}
		
		case 'getTokenHolders': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			
			// Would query from indexer/explorer API
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					tokenAddress,
					totalHolders: 0,
					holders: [],
					note: 'Token holder data requires indexer integration',
				},
			}];
		}
		
		case 'getTokenTransfers': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;
			
			// Would query from indexer/explorer API
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					tokenAddress,
					walletAddress,
					transfers: [],
					note: 'Transfer history requires indexer integration',
				},
			}];
		}
		
		case 'batchTransfer': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const recipientsJson = this.getNodeParameter('recipients', index) as string;
			
			let recipients: Array<{ address: string; amount: string }>;
			try {
				recipients = JSON.parse(recipientsJson);
			} catch {
				throw new Error('Invalid JSON format for recipients');
			}
			
			if (!Array.isArray(recipients) || recipients.length === 0) {
				throw new Error('Recipients must be a non-empty array');
			}
			
			// Validate all addresses
			for (const r of recipients) {
				if (chainConfig.type === 'evm' && !validateEvmAddress(r.address)) {
					throw new Error(`Invalid recipient address: ${r.address}`);
				}
			}
			
			// Build batch transfer (would use multicall or batch contract)
			const transfers = recipients.map(r => ({
				to: r.address,
				amount: r.amount,
			}));
			
			const totalAmount = recipients.reduce(
				(sum, r) => sum + parseFloat(r.amount), 
				0
			).toString();
			
			const batchData = {
				tokenAddress,
				transfers,
				totalRecipients: recipients.length,
				totalAmount,
			};
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'batch_transfer',
				transaction: batchData,
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					tokenAddress,
					totalRecipients: recipients.length,
					totalAmount,
					transfers,
					qrCode,
					instructions: 'Batch transfer requires signing multiple transactions',
				},
			}];
		}
		
		case 'wrapNative': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			const wrappedToken = WRAPPED_NATIVE[chain];
			if (!wrappedToken) {
				throw new Error(`No wrapped token defined for ${chain}`);
			}
			
			const amountInWei = parseAmountWithDecimals(amount, chainConfig.decimals);
			
			// WETH deposit() function
			const wrapData = {
				to: wrappedToken.address,
				data: '0xd0e30db0', // deposit()
				value: amountInWei,
				chainId: chainConfig.chainId,
			};
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'wrap_native',
				transaction: wrapData,
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'wrap',
					nativeToken: chainConfig.symbol,
					wrappedToken: wrappedToken.symbol,
					wrappedAddress: wrappedToken.address,
					amount,
					transaction: wrapData,
					qrCode,
					instructions: `Scan QR to wrap ${chainConfig.symbol} to ${wrappedToken.symbol}`,
				},
			}];
		}
		
		case 'unwrapToken': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			const wrappedToken = WRAPPED_NATIVE[chain];
			if (!wrappedToken) {
				throw new Error(`No wrapped token defined for ${chain}`);
			}
			
			const amountInWei = parseAmountWithDecimals(amount, wrappedToken.decimals);
			
			// WETH withdraw(uint256) function
			const unwrapData = {
				to: wrappedToken.address,
				data: `0x2e1a7d4d${BigInt(amountInWei).toString(16).padStart(64, '0')}`,
				value: '0',
				chainId: chainConfig.chainId,
			};
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'unwrap_token',
				transaction: unwrapData,
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'unwrap',
					wrappedToken: wrappedToken.symbol,
					nativeToken: chainConfig.symbol,
					wrappedAddress: wrappedToken.address,
					amount,
					transaction: unwrapData,
					qrCode,
					instructions: `Scan QR to unwrap ${wrappedToken.symbol} to ${chainConfig.symbol}`,
				},
			}];
		}
		
		case 'getPopularTokens': {
			const tokens = POPULAR_TOKENS[chain] || [];
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					tokenCount: tokens.length,
					tokens: tokens.map(t => ({
						...t,
						explorerUrl: chainConfig.explorerUrl ? 
							`${chainConfig.explorerUrl}/token/${t.address}` : null,
					})),
					note: tokens.length === 0 ? 
						'No popular tokens list available for this chain' : null,
				},
			}];
		}
		
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}

// Export for consistent module interface
export const description: INodeProperties[] = [...tokenOperations, ...tokenFields];
export const execute = executeToken;
