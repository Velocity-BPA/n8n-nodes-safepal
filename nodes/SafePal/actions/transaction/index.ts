/**
 * SafePal Transaction Operations
 * Transaction building, parsing, and management
 * 
 * SPDX-License-Identifier: BSL-1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { getChainConfig } from '../../constants/chains';
import { getChainOptions, formatAmount, parseAmount, parseAmountWithDecimals, serializeEvmTransaction } from '../../utils/chainUtils';
import { validateAddress } from '../../utils/addressUtils';
import { createQrHandler } from '../../transport/qrHandler';

export const transactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{
				name: 'Build Transaction',
				value: 'buildTransaction',
				description: 'Build an unsigned transaction',
				action: 'Build unsigned transaction',
			},
			{
				name: 'Parse Transaction',
				value: 'parseTransaction',
				description: 'Parse a raw transaction',
				action: 'Parse transaction',
			},
			{
				name: 'Estimate Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a transaction',
				action: 'Estimate transaction gas',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get transaction details',
			},
			{
				name: 'Get Transaction Receipt',
				value: 'getTransactionReceipt',
				description: 'Get transaction receipt',
				action: 'Get transaction receipt',
			},
			{
				name: 'Generate Signing QR',
				value: 'generateSigningQr',
				description: 'Generate QR code for transaction signing',
				action: 'Generate signing QR',
			},
			{
				name: 'Parse Signature',
				value: 'parseSignature',
				description: 'Parse signature from device response',
				action: 'Parse signature',
			},
			{
				name: 'Apply Signature',
				value: 'applySignature',
				description: 'Apply signature to unsigned transaction',
				action: 'Apply signature to transaction',
			},
			{
				name: 'Broadcast Transaction',
				value: 'broadcastTransaction',
				description: 'Broadcast signed transaction to network',
				action: 'Broadcast transaction',
			},
			{
				name: 'Simulate Transaction',
				value: 'simulateTransaction',
				description: 'Simulate transaction execution',
				action: 'Simulate transaction',
			},
			{
				name: 'Get Transaction Status',
				value: 'getTransactionStatus',
				description: 'Check transaction confirmation status',
				action: 'Get transaction status',
			},
			{
				name: 'Cancel Transaction',
				value: 'cancelTransaction',
				description: 'Create replacement transaction to cancel pending tx',
				action: 'Cancel pending transaction',
			},
			{
				name: 'Speed Up Transaction',
				value: 'speedUpTransaction',
				description: 'Create replacement transaction with higher gas',
				action: 'Speed up transaction',
			},
			{
				name: 'Batch Transactions',
				value: 'batchTransactions',
				description: 'Prepare multiple transactions for batch signing',
				action: 'Batch transactions',
			},
		],
		default: 'buildTransaction',
	},
];

export const transactionFields: INodeProperties[] = [
	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: getChainOptions(),
		default: 'ethereum',
		description: 'Blockchain network',
	},
	// Basic transaction fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction', 'estimateGas', 'simulateTransaction'],
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
				resource: ['transaction'],
				operation: ['buildTransaction', 'estimateGas'],
			},
		},
		default: '0',
		description: 'Amount to send (in native units)',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction', 'estimateGas', 'parseTransaction', 'simulateTransaction'],
			},
		},
		default: '0x',
		description: 'Transaction data (hex encoded)',
	},
	// Transaction hash
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getTransaction', 'getTransactionReceipt', 'getTransactionStatus', 'cancelTransaction', 'speedUpTransaction'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Transaction hash',
	},
	// Raw transaction
	{
		displayName: 'Raw Transaction',
		name: 'rawTransaction',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['parseTransaction', 'broadcastTransaction'],
			},
		},
		default: '',
		description: 'Raw transaction data (hex encoded)',
	},
	// Unsigned transaction
	{
		displayName: 'Unsigned Transaction',
		name: 'unsignedTransaction',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['generateSigningQr', 'applySignature'],
			},
		},
		default: '{}',
		description: 'Unsigned transaction object',
	},
	// Signature
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['applySignature'],
			},
		},
		default: '',
		description: 'Transaction signature',
	},
	// Signature QR data
	{
		displayName: 'Signature QR Data',
		name: 'signatureQrData',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['parseSignature'],
			},
		},
		default: '',
		description: 'QR data scanned from device containing signature',
	},
	// Gas options
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction'],
			},
		},
		default: 21000,
		description: 'Gas limit for the transaction',
	},
	{
		displayName: 'Gas Price (Gwei)',
		name: 'gasPrice',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction', 'speedUpTransaction'],
			},
		},
		default: 0,
		description: 'Gas price in Gwei (0 for auto)',
	},
	{
		displayName: 'Max Fee Per Gas (Gwei)',
		name: 'maxFeePerGas',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction'],
			},
		},
		default: 0,
		description: 'Max fee per gas for EIP-1559 (0 for auto)',
	},
	{
		displayName: 'Max Priority Fee (Gwei)',
		name: 'maxPriorityFeePerGas',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction'],
			},
		},
		default: 0,
		description: 'Max priority fee for EIP-1559 (0 for auto)',
	},
	// Nonce
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction', 'cancelTransaction', 'speedUpTransaction'],
			},
		},
		default: -1,
		description: 'Transaction nonce (-1 for auto)',
	},
	// Speed up multiplier
	{
		displayName: 'Gas Price Multiplier',
		name: 'gasPriceMultiplier',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['speedUpTransaction'],
			},
		},
		default: 1.5,
		description: 'Multiply original gas price by this factor',
	},
	// Batch transactions
	{
		displayName: 'Transactions',
		name: 'transactions',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['batchTransactions'],
			},
		},
		default: '[\n  {"to": "0x...", "amount": "0.1"},\n  {"to": "0x...", "amount": "0.2"}\n]',
		description: 'Array of transactions to batch',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		default: 0,
		description: 'Account index for signing',
	},
];

export async function executeTransaction(
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
		case 'buildTransaction': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const data = this.getNodeParameter('data', index, '0x') as string;
			const gasLimit = this.getNodeParameter('gasLimit', index, 21000) as number;
			const gasPrice = this.getNodeParameter('gasPrice', index, 0) as number;
			const maxFeePerGas = this.getNodeParameter('maxFeePerGas', index, 0) as number;
			const maxPriorityFeePerGas = this.getNodeParameter('maxPriorityFeePerGas', index, 0) as number;
			const nonce = this.getNodeParameter('nonce', index, -1) as number;
			
			if (!validateAddress(toAddress, chain)) {
				throw new Error(`Invalid ${chainConfig.name} address: ${toAddress}`);
			}
			
			const value = parseAmountWithDecimals(amount, chainConfig.decimals);
			
			let transaction: Record<string, unknown>;
			
			if (chainConfig.type === 'evm') {
				// EIP-1559 transaction
				const isEip1559 = maxFeePerGas > 0 || maxPriorityFeePerGas > 0;
				
				if (isEip1559) {
					transaction = {
						type: 2,
						chainId: chainConfig.chainId,
						to: toAddress,
						value,
						data,
						gasLimit,
						maxFeePerGas: maxFeePerGas > 0 ? parseAmountWithDecimals(maxFeePerGas.toString(), 9) : undefined,
						maxPriorityFeePerGas: maxPriorityFeePerGas > 0 ? parseAmountWithDecimals(maxPriorityFeePerGas.toString(), 9) : undefined,
						nonce: nonce >= 0 ? nonce : undefined,
					};
				} else {
					transaction = {
						type: 0,
						chainId: chainConfig.chainId,
						to: toAddress,
						value,
						data,
						gasLimit,
						gasPrice: gasPrice > 0 ? parseAmountWithDecimals(gasPrice.toString(), 9) : undefined,
						nonce: nonce >= 0 ? nonce : undefined,
					};
				}
			} else {
				// Generic transaction structure for other chains
				transaction = {
					chain,
					to: toAddress,
					value,
					data,
				};
			}
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					unsignedTransaction: transaction,
					amount,
					recipient: toAddress,
					estimatedGas: gasLimit,
					transactionType: chainConfig.type === 'evm' ? 
						(maxFeePerGas > 0 ? 'EIP-1559' : 'Legacy') : chainConfig.type,
				},
			}];
		}
		
		case 'parseTransaction': {
			const rawTransaction = this.getNodeParameter('rawTransaction', index) as string;
			
			// In production, would parse the raw transaction bytes
			// For now, return structure
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					parsed: {
						rawHex: rawTransaction,
						note: 'Transaction parsing requires specific chain decoder',
					},
				},
			}];
		}
		
		case 'estimateGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index, '0') as string;
			const data = this.getNodeParameter('data', index, '0x') as string;
			
			// Base gas costs
			let estimatedGas = 21000; // Base transfer
			
			if (data && data !== '0x') {
				// Contract interaction
				estimatedGas = 100000;
				
				// Additional gas for data length
				const dataBytes = (data.length - 2) / 2;
				estimatedGas += dataBytes * 16; // 16 gas per non-zero byte
			}
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					estimatedGas,
					gasWithBuffer: Math.ceil(estimatedGas * 1.2),
					to: toAddress,
					value: amount,
					hasData: data !== '0x',
				},
			}];
		}
		
		case 'getTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			
			// Would query from RPC
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					txHash,
					explorerUrl: chainConfig.explorerUrl ? 
						`${chainConfig.explorerUrl}/tx/${txHash}` : null,
					note: 'Query transaction from RPC endpoint',
				},
			}];
		}
		
		case 'getTransactionReceipt': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			
			// Would query from RPC
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					txHash,
					receipt: null,
					note: 'Query receipt from RPC endpoint',
				},
			}];
		}
		
		case 'generateSigningQr': {
			const unsignedTxJson = this.getNodeParameter('unsignedTransaction', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			let unsignedTx: Record<string, unknown>;
			try {
				unsignedTx = JSON.parse(unsignedTxJson);
			} catch {
				throw new Error('Invalid JSON for unsigned transaction');
			}
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				chainId: chainConfig.chainId,
				type: chainConfig.type,
				transaction: unsignedTx,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					unsignedTransaction: unsignedTx,
					qrCode,
					accountIndex,
					instructions: 'Scan QR with SafePal device to sign transaction',
				},
			}];
		}
		
		case 'parseSignature': {
			const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
			
			const parsed = await qrHandler.parseSignatureQr(signatureQrData);
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					signature: parsed,
				},
			}];
		}
		
		case 'applySignature': {
			const unsignedTxJson = this.getNodeParameter('unsignedTransaction', index) as string;
			const signature = this.getNodeParameter('signature', index) as string;
			
			let unsignedTx: Record<string, unknown>;
			try {
				unsignedTx = JSON.parse(unsignedTxJson);
			} catch {
				throw new Error('Invalid JSON for unsigned transaction');
			}
			
			// Apply signature to transaction
			const signedTx = {
				...unsignedTx,
				signature,
			};
			
			// Serialize if EVM
			let serialized: string | undefined;
			if (chainConfig.type === 'evm') {
				try {
					serialized = serializeEvmTransaction(unsignedTx as any);
				} catch {
					serialized = undefined;
				}
			}
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					signedTransaction: signedTx,
					serialized,
					readyToBroadcast: !!serialized,
				},
			}];
		}
		
		case 'broadcastTransaction': {
			const rawTransaction = this.getNodeParameter('rawTransaction', index) as string;
			
			// Would send to RPC
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					rawTransaction,
					broadcast: false,
					note: 'Broadcasting requires RPC connection',
					rpcUrl: chainConfig.rpcUrl,
				},
			}];
		}
		
		case 'simulateTransaction': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const data = this.getNodeParameter('data', index, '0x') as string;
			
			// Would use eth_call or similar
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					simulation: {
						to: toAddress,
						data,
						wouldSucceed: true,
						note: 'Simulation requires RPC connection',
					},
				},
			}];
		}
		
		case 'getTransactionStatus': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			
			// Would query from RPC
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					txHash,
					status: 'unknown',
					confirmations: 0,
					explorerUrl: chainConfig.explorerUrl ? 
						`${chainConfig.explorerUrl}/tx/${txHash}` : null,
				},
			}];
		}
		
		case 'cancelTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			const nonce = this.getNodeParameter('nonce', index) as number;
			const gasPrice = this.getNodeParameter('gasPrice', index, 0) as number;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			if (chainConfig.type !== 'evm') {
				throw new Error(`Transaction cancellation not supported for ${chainConfig.type}`);
			}
			
			// Create 0-value self-transfer with same nonce
			const cancelTx = {
				type: 0,
				chainId: chainConfig.chainId,
				to: '[SENDER_ADDRESS]', // Would get from original tx
				value: '0',
				data: '0x',
				gasLimit: 21000,
				gasPrice: gasPrice > 0 ? parseAmountWithDecimals(gasPrice.toString(), 9) : undefined,
				nonce,
			};
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'cancel',
				originalTxHash: txHash,
				transaction: cancelTx,
				accountIndex,
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					originalTxHash: txHash,
					cancelTransaction: cancelTx,
					qrCode,
					instructions: 'Sign this 0-value transaction to cancel the pending transaction',
					note: 'Cancellation is not guaranteed if original tx is already mined',
				},
			}];
		}
		
		case 'speedUpTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			const gasPriceMultiplier = this.getNodeParameter('gasPriceMultiplier', index, 1.5) as number;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			if (chainConfig.type !== 'evm') {
				throw new Error(`Transaction speed-up not supported for ${chainConfig.type}`);
			}
			
			// Would fetch original transaction and create replacement
			const speedUpTx = {
				note: 'Fetch original transaction and create replacement with higher gas',
				originalTxHash: txHash,
				gasPriceMultiplier,
			};
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					originalTxHash: txHash,
					gasPriceMultiplier,
					speedUpTransaction: speedUpTx,
					instructions: 'Fetch original tx, multiply gas price, sign replacement',
				},
			}];
		}
		
		case 'batchTransactions': {
			const transactionsJson = this.getNodeParameter('transactions', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			let transactions: Array<{ to: string; amount: string; data?: string }>;
			try {
				transactions = JSON.parse(transactionsJson);
			} catch {
				throw new Error('Invalid JSON for transactions');
			}
			
			if (!Array.isArray(transactions) || transactions.length === 0) {
				throw new Error('Transactions must be a non-empty array');
			}
			
			// Build batch
			const batch = transactions.map((tx, i) => ({
				index: i,
				chain: chainConfig.name,
				to: tx.to,
				value: parseAmountWithDecimals(tx.amount || '0', chainConfig.decimals),
				data: tx.data || '0x',
			}));
			
			const totalAmount = transactions.reduce(
				(sum, tx) => sum + parseFloat(tx.amount || '0'),
				0
			);
			
			const qrCode = await qrHandler.generateTransactionQr({
				chain,
				type: 'batch',
				transactions: batch,
				accountIndex,
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					transactionCount: batch.length,
					totalAmount: totalAmount.toString(),
					transactions: batch,
					qrCode,
					instructions: 'Scan QR to sign all transactions in batch',
				},
			}];
		}
		
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}

// Export for consistent module interface
export const description: INodeProperties[] = [...transactionOperations, ...transactionFields];
export const execute = executeTransaction;
