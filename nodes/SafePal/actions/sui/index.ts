/**
 * SafePal Sui Blockchain Actions
 * Operations for Sui blockchain interactions via SafePal hardware wallets
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { CHAIN_CONFIGS } from '../../constants/chains';
import { createQrHandler } from '../../transport/qrHandler';
import { formatAmountWithDecimals, parseAmountWithDecimals } from '../../utils/chainUtils';

const qrHandler = createQrHandler();

export const suiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['sui'],
			},
		},
		options: [
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get Sui address from SafePal device',
				action: 'Get sui address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get SUI balance for an address',
				action: 'Get sui balance',
			},
			{
				name: 'Send SUI',
				value: 'sendSui',
				description: 'Create transaction to send SUI',
				action: 'Send sui',
			},
			{
				name: 'Send Coin',
				value: 'sendCoin',
				description: 'Send any Sui coin type',
				action: 'Send sui coin',
			},
			{
				name: 'Get Coins',
				value: 'getCoins',
				description: 'Get all coins owned by an address',
				action: 'Get coins',
			},
			{
				name: 'Get Objects',
				value: 'getObjects',
				description: 'Get all objects owned by an address',
				action: 'Get objects',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a message with Sui account',
				action: 'Sign message',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a transaction block',
				action: 'Sign transaction',
			},
			{
				name: 'Move Call',
				value: 'moveCall',
				description: 'Call a Move function',
				action: 'Move call',
			},
			{
				name: 'Stake SUI',
				value: 'stakeSui',
				description: 'Stake SUI with a validator',
				action: 'Stake sui',
			},
			{
				name: 'Unstake SUI',
				value: 'unstakeSui',
				description: 'Unstake SUI from a validator',
				action: 'Unstake sui',
			},
			{
				name: 'Get Staking Info',
				value: 'getStakingInfo',
				description: 'Get staking information for an address',
				action: 'Get staking info',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by digest',
				action: 'Get transaction details',
			},
		],
		default: 'getAddress',
	},
];

export const suiFields: INodeProperties[] = [
	// Network selection
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['sui'],
			},
		},
		options: [
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Testnet', value: 'testnet' },
			{ name: 'Devnet', value: 'devnet' },
		],
		default: 'mainnet',
		description: 'Sui network to use',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['getAddress'],
			},
		},
		default: 0,
		description: 'Account index for address derivation (BIP44)',
	},
	// Address field
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['getBalance', 'getCoins', 'getObjects', 'getStakingInfo'],
			},
		},
		default: '',
		placeholder: '0x1234...abcd',
		description: 'Sui address (64 hex characters with 0x prefix)',
	},
	// From address
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['sendSui', 'sendCoin', 'moveCall', 'stakeSui', 'unstakeSui'],
			},
		},
		default: '',
		required: true,
		description: 'Sender Sui address',
	},
	// To address
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['sendSui', 'sendCoin'],
			},
		},
		default: '',
		required: true,
		description: 'Recipient Sui address',
	},
	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['sendSui', 'sendCoin', 'stakeSui'],
			},
		},
		default: '',
		required: true,
		description: 'Amount to send (in SUI or coin units)',
	},
	// Coin type
	{
		displayName: 'Coin Type',
		name: 'coinType',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['sendCoin', 'getCoins'],
			},
		},
		default: '0x2::sui::SUI',
		placeholder: '0x2::sui::SUI',
		description: 'Full coin type identifier',
	},
	// Decimals
	{
		displayName: 'Decimals',
		name: 'decimals',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['sendCoin'],
			},
		},
		default: 9,
		description: 'Number of decimals for the coin',
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['signMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Message to sign',
	},
	// Signer address
	{
		displayName: 'Signer Address',
		name: 'signerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['signMessage', 'signTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Address to sign with',
	},
	// Transaction bytes
	{
		displayName: 'Transaction Bytes',
		name: 'transactionBytes',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['signTransaction'],
			},
		},
		default: '',
		required: true,
		typeOptions: {
			rows: 4,
		},
		description: 'Base64-encoded transaction bytes',
	},
	// Move call fields
	{
		displayName: 'Package',
		name: 'package',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['moveCall'],
			},
		},
		default: '',
		required: true,
		placeholder: '0x2',
		description: 'Package object ID',
	},
	{
		displayName: 'Module',
		name: 'module',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['moveCall'],
			},
		},
		default: '',
		required: true,
		placeholder: 'coin',
		description: 'Module name',
	},
	{
		displayName: 'Function',
		name: 'function',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['moveCall'],
			},
		},
		default: '',
		required: true,
		placeholder: 'transfer',
		description: 'Function name',
	},
	{
		displayName: 'Type Arguments',
		name: 'typeArguments',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['moveCall'],
			},
		},
		default: '',
		placeholder: '0x2::sui::SUI',
		description: 'Comma-separated type arguments',
	},
	{
		displayName: 'Function Arguments',
		name: 'functionArguments',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['moveCall'],
			},
		},
		default: '[]',
		description: 'JSON array of function arguments',
	},
	// Staking fields
	{
		displayName: 'Validator Address',
		name: 'validatorAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['stakeSui'],
			},
		},
		default: '',
		required: true,
		description: 'Validator address to stake with',
	},
	{
		displayName: 'Staked Sui Object ID',
		name: 'stakedSuiId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['unstakeSui'],
			},
		},
		default: '',
		required: true,
		description: 'Object ID of the StakedSui object',
	},
	// Transaction digest
	{
		displayName: 'Transaction Digest',
		name: 'txDigest',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['getTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Transaction digest to look up',
	},
	// Gas budget
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['sui'],
				operation: ['sendSui', 'sendCoin', 'moveCall', 'stakeSui', 'unstakeSui'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Gas Budget',
				name: 'gasBudget',
				type: 'number',
				default: 10000000,
				description: 'Maximum gas budget in MIST',
			},
			{
				displayName: 'Gas Price',
				name: 'gasPrice',
				type: 'number',
				default: 1000,
				description: 'Gas price in MIST',
			},
		],
	},
];

// Sui address validation (same format as Aptos - 64 hex chars)
function validateSuiAddress(address: string): boolean {
	if (!address.startsWith('0x')) return false;
	const hex = address.slice(2);
	// Sui addresses are 64 hex characters (32 bytes)
	if (hex.length !== 64) return false;
	return /^[0-9a-fA-F]+$/.test(hex);
}

// Get RPC URL based on network
function getSuiRpcUrl(network: string): string {
	switch (network) {
		case 'mainnet':
			return 'https://fullnode.mainnet.sui.io:443';
		case 'testnet':
			return 'https://fullnode.testnet.sui.io:443';
		case 'devnet':
			return 'https://fullnode.devnet.sui.io:443';
		default:
			return 'https://fullnode.mainnet.sui.io:443';
	}
}

// Convert SUI to MIST (1 SUI = 10^9 MIST)
function suiToMist(sui: string): string {
	return parseAmountWithDecimals(sui, 9);
}

// Convert MIST to SUI
function mistToSui(mist: string): string {
	return formatAmountWithDecimals(mist, 9);
}

export async function executeSui(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const rpcUrl = getSuiRpcUrl(network);
	const chainConfig = CHAIN_CONFIGS['sui'];

	const results: INodeExecutionData[] = [];

	switch (operation) {
		case 'getAddress': {
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const derivationPath = `m/44'/784'/${accountIndex}'/0'/0'`;

			const qrData = await qrHandler.generateSyncQr({
				action: 'get_address',
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				derivationPath,
				network,
			});

			results.push({
				json: {
					operation: 'getAddress',
					chain: 'sui',
					network,
					derivationPath,
					accountIndex,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to get your Sui address',
				},
			});
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateSuiAddress(address)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid Sui address format. Must be 0x followed by 64 hex characters.',
				);
			}

			results.push({
				json: {
					operation: 'getBalance',
					chain: 'sui',
					network,
					address,
					rpcUrl,
					coinType: '0x2::sui::SUI',
					rpcMethod: 'suix_getBalance',
					rpcParams: [address, '0x2::sui::SUI'],
					note: 'Use JSON-RPC call to get balance',
				},
			});
			break;
		}

		case 'sendSui': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasBudget?: number;
				gasPrice?: number;
			};

			if (!validateSuiAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Sui address');
			}
			if (!validateSuiAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient Sui address');
			}

			const amountMist = suiToMist(amount);

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				from: fromAddress,
				to: toAddress,
				value: amountMist,
				type: 'sui_transfer',
				network,
				gasBudget: options.gasBudget || 10000000,
				gasPrice: options.gasPrice || 1000,
			});

			results.push({
				json: {
					operation: 'sendSui',
					chain: 'sui',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					amountMist,
					options,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'sendCoin': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const coinType = this.getNodeParameter('coinType', index) as string;
			const decimals = this.getNodeParameter('decimals', index, 9) as number;
			const options = this.getNodeParameter('options', index, {}) as {
				gasBudget?: number;
				gasPrice?: number;
			};

			if (!validateSuiAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Sui address');
			}
			if (!validateSuiAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient Sui address');
			}

			const amountRaw = parseAmountWithDecimals(amount, decimals);

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				from: fromAddress,
				to: toAddress,
				value: amountRaw,
				type: 'sui_coin_transfer',
				network,
				coinType,
				gasBudget: options.gasBudget || 10000000,
			});

			results.push({
				json: {
					operation: 'sendCoin',
					chain: 'sui',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					amountRaw,
					coinType,
					decimals,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'getCoins': {
			const address = this.getNodeParameter('address', index) as string;
			const coinType = this.getNodeParameter('coinType', index, '0x2::sui::SUI') as string;

			if (!validateSuiAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Sui address format');
			}

			results.push({
				json: {
					operation: 'getCoins',
					chain: 'sui',
					network,
					address,
					coinType,
					rpcUrl,
					rpcMethod: 'suix_getCoins',
					rpcParams: [address, coinType],
					note: 'Use JSON-RPC call to get coins',
				},
			});
			break;
		}

		case 'getObjects': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateSuiAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Sui address format');
			}

			results.push({
				json: {
					operation: 'getObjects',
					chain: 'sui',
					network,
					address,
					rpcUrl,
					rpcMethod: 'suix_getOwnedObjects',
					rpcParams: [address],
					note: 'Use JSON-RPC call to get owned objects',
				},
			});
			break;
		}

		case 'signMessage': {
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const message = this.getNodeParameter('message', index) as string;

			if (!validateSuiAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer Sui address');
			}

			const qrData = await qrHandler.generateMessageQr({
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				address: signerAddress,
				message,
				type: 'sui_message',
				network,
			});

			results.push({
				json: {
					operation: 'signMessage',
					chain: 'sui',
					network,
					signerAddress,
					message,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the message',
				},
			});
			break;
		}

		case 'signTransaction': {
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const transactionBytes = this.getNodeParameter('transactionBytes', index) as string;

			if (!validateSuiAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer Sui address');
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				from: signerAddress,
				data: transactionBytes,
				type: 'sui_transaction_block',
				network,
			});

			results.push({
				json: {
					operation: 'signTransaction',
					chain: 'sui',
					network,
					signerAddress,
					transactionBytes,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'moveCall': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const packageId = this.getNodeParameter('package', index) as string;
			const module = this.getNodeParameter('module', index) as string;
			const func = this.getNodeParameter('function', index) as string;
			const typeArgumentsStr = this.getNodeParameter('typeArguments', index, '') as string;
			const functionArguments = this.getNodeParameter('functionArguments', index, '[]') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasBudget?: number;
				gasPrice?: number;
			};

			if (!validateSuiAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Sui address');
			}

			const typeArguments = typeArgumentsStr ? typeArgumentsStr.split(',').map(t => t.trim()) : [];
			let parsedArguments: unknown[];
			try {
				parsedArguments = JSON.parse(functionArguments);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid function arguments JSON');
			}

			const moveCall = {
				package: packageId,
				module,
				function: func,
				typeArguments,
				arguments: parsedArguments,
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				from: fromAddress,
				data: JSON.stringify(moveCall),
				type: 'sui_move_call',
				network,
				gasBudget: options.gasBudget || 10000000,
			});

			results.push({
				json: {
					operation: 'moveCall',
					chain: 'sui',
					network,
					from: fromAddress,
					moveCall,
					options,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'stakeSui': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasBudget?: number;
			};

			if (!validateSuiAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Sui address');
			}
			if (!validateSuiAddress(validatorAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid validator Sui address');
			}

			const amountMist = suiToMist(amount);

			const stakeRequest = {
				action: 'stake',
				validator: validatorAddress,
				amount: amountMist,
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				from: fromAddress,
				to: validatorAddress,
				value: amountMist,
				data: JSON.stringify(stakeRequest),
				type: 'sui_stake',
				network,
				gasBudget: options.gasBudget || 10000000,
			});

			results.push({
				json: {
					operation: 'stakeSui',
					chain: 'sui',
					network,
					from: fromAddress,
					validatorAddress,
					amount,
					amountMist,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the staking transaction',
				},
			});
			break;
		}

		case 'unstakeSui': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const stakedSuiId = this.getNodeParameter('stakedSuiId', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasBudget?: number;
			};

			if (!validateSuiAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Sui address');
			}

			const unstakeRequest = {
				action: 'unstake',
				stakedSuiId,
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'sui',
				chainId: chainConfig.chainId || 'sui',
				from: fromAddress,
				data: JSON.stringify(unstakeRequest),
				type: 'sui_unstake',
				network,
				gasBudget: options.gasBudget || 10000000,
			});

			results.push({
				json: {
					operation: 'unstakeSui',
					chain: 'sui',
					network,
					from: fromAddress,
					stakedSuiId,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the unstaking transaction',
				},
			});
			break;
		}

		case 'getStakingInfo': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateSuiAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Sui address format');
			}

			results.push({
				json: {
					operation: 'getStakingInfo',
					chain: 'sui',
					network,
					address,
					rpcUrl,
					rpcMethod: 'suix_getStakes',
					rpcParams: [address],
					note: 'Use JSON-RPC call to get staking info',
				},
			});
			break;
		}

		case 'getTransaction': {
			const txDigest = this.getNodeParameter('txDigest', index) as string;

			results.push({
				json: {
					operation: 'getTransaction',
					chain: 'sui',
					network,
					txDigest,
					rpcUrl,
					rpcMethod: 'sui_getTransactionBlock',
					rpcParams: [txDigest, { showInput: true, showEffects: true, showEvents: true }],
					explorerUrl: `https://suiscan.xyz/${network}/tx/${txDigest}`,
					note: 'Use JSON-RPC call to get transaction details',
				},
			});
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return results;
}

// Export for consistent module interface
export const description: INodeProperties[] = [...suiOperations, ...suiFields];
export const execute = executeSui;
