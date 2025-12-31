/**
 * SafePal Aptos Blockchain Actions
 * Operations for Aptos blockchain interactions via SafePal hardware wallets
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

export const aptosOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['aptos'],
			},
		},
		options: [
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get Aptos address from SafePal device',
				action: 'Get aptos address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get APT balance for an address',
				action: 'Get aptos balance',
			},
			{
				name: 'Send APT',
				value: 'sendApt',
				description: 'Create transaction to send APT',
				action: 'Send apt',
			},
			{
				name: 'Send Coin',
				value: 'sendCoin',
				description: 'Send any Aptos coin type',
				action: 'Send aptos coin',
			},
			{
				name: 'Get Token Balance',
				value: 'getTokenBalance',
				description: 'Get balance of a specific coin type',
				action: 'Get token balance',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a message with Aptos account',
				action: 'Sign message',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a raw Aptos transaction',
				action: 'Sign transaction',
			},
			{
				name: 'Call Entry Function',
				value: 'callEntryFunction',
				description: 'Call a Move entry function',
				action: 'Call entry function',
			},
			{
				name: 'Get Resources',
				value: 'getResources',
				description: 'Get account resources',
				action: 'Get account resources',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get transaction details',
			},
		],
		default: 'getAddress',
	},
];

export const aptosFields: INodeProperties[] = [
	// Network selection
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['aptos'],
			},
		},
		options: [
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Testnet', value: 'testnet' },
			{ name: 'Devnet', value: 'devnet' },
		],
		default: 'mainnet',
		description: 'Aptos network to use',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['getAddress'],
			},
		},
		default: 0,
		description: 'Account index for address derivation (BIP44)',
	},
	// Address field for balance/send operations
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['getBalance', 'getTokenBalance', 'getResources'],
			},
		},
		default: '',
		placeholder: '0x1234...abcd',
		description: 'Aptos address (64 hex characters with 0x prefix)',
	},
	// Send APT fields
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['sendApt', 'sendCoin', 'callEntryFunction'],
			},
		},
		default: '',
		required: true,
		description: 'Sender Aptos address',
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['sendApt', 'sendCoin'],
			},
		},
		default: '',
		required: true,
		description: 'Recipient Aptos address',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['sendApt', 'sendCoin'],
			},
		},
		default: '',
		required: true,
		description: 'Amount to send (in APT or coin units)',
	},
	// Coin type for sendCoin and getTokenBalance
	{
		displayName: 'Coin Type',
		name: 'coinType',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['sendCoin', 'getTokenBalance'],
			},
		},
		default: '0x1::aptos_coin::AptosCoin',
		placeholder: '0x1::aptos_coin::AptosCoin',
		description: 'Full coin type identifier',
	},
	// Decimals for coin
	{
		displayName: 'Decimals',
		name: 'decimals',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['sendCoin'],
			},
		},
		default: 8,
		description: 'Number of decimals for the coin',
	},
	// Sign message field
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['signMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Message to sign',
	},
	{
		displayName: 'Signer Address',
		name: 'signerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['signMessage', 'signTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Address to sign with',
	},
	// Raw transaction for signing
	{
		displayName: 'Raw Transaction',
		name: 'rawTransaction',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['signTransaction'],
			},
		},
		default: '',
		required: true,
		typeOptions: {
			rows: 4,
		},
		description: 'BCS-serialized transaction (hex)',
	},
	// Entry function fields
	{
		displayName: 'Module Address',
		name: 'moduleAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['callEntryFunction'],
			},
		},
		default: '0x1',
		required: true,
		description: 'Address of the module',
	},
	{
		displayName: 'Module Name',
		name: 'moduleName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['callEntryFunction'],
			},
		},
		default: '',
		required: true,
		placeholder: 'coin',
		description: 'Name of the module',
	},
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['callEntryFunction'],
			},
		},
		default: '',
		required: true,
		placeholder: 'transfer',
		description: 'Name of the entry function',
	},
	{
		displayName: 'Type Arguments',
		name: 'typeArguments',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['callEntryFunction'],
			},
		},
		default: '',
		placeholder: '0x1::aptos_coin::AptosCoin',
		description: 'Comma-separated type arguments',
	},
	{
		displayName: 'Function Arguments',
		name: 'functionArguments',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['callEntryFunction'],
			},
		},
		default: '[]',
		description: 'JSON array of function arguments',
	},
	// Transaction hash
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['getTransaction'],
			},
		},
		default: '',
		required: true,
		placeholder: '0x...',
		description: 'Transaction hash to look up',
	},
	// Transaction options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['aptos'],
				operation: ['sendApt', 'sendCoin', 'callEntryFunction'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Max Gas Amount',
				name: 'maxGasAmount',
				type: 'number',
				default: 200000,
				description: 'Maximum gas units for transaction',
			},
			{
				displayName: 'Gas Unit Price',
				name: 'gasUnitPrice',
				type: 'number',
				default: 100,
				description: 'Gas unit price in Octas',
			},
			{
				displayName: 'Expiration Seconds',
				name: 'expirationSeconds',
				type: 'number',
				default: 600,
				description: 'Transaction expiration time in seconds from now',
			},
			{
				displayName: 'Sequence Number',
				name: 'sequenceNumber',
				type: 'number',
				default: -1,
				description: 'Account sequence number (-1 for auto)',
			},
		],
	},
];

// Aptos address validation
function validateAptosAddress(address: string): boolean {
	if (!address.startsWith('0x')) return false;
	const hex = address.slice(2);
	// Aptos addresses are 64 hex characters (32 bytes)
	if (hex.length !== 64) return false;
	return /^[0-9a-fA-F]+$/.test(hex);
}

// Get RPC URL based on network
function getAptosRpcUrl(network: string): string {
	switch (network) {
		case 'mainnet':
			return 'https://fullnode.mainnet.aptoslabs.com/v1';
		case 'testnet':
			return 'https://fullnode.testnet.aptoslabs.com/v1';
		case 'devnet':
			return 'https://fullnode.devnet.aptoslabs.com/v1';
		default:
			return 'https://fullnode.mainnet.aptoslabs.com/v1';
	}
}

// Convert APT to Octas (1 APT = 10^8 Octas)
function aptToOctas(apt: string): string {
	return parseAmountWithDecimals(apt, 8);
}

// Convert Octas to APT
function octasToApt(octas: string): string {
	return formatAmountWithDecimals(octas, 8);
}

export async function executeAptos(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const rpcUrl = getAptosRpcUrl(network);
	const chainConfig = CHAIN_CONFIGS['aptos'];

	const results: INodeExecutionData[] = [];

	switch (operation) {
		case 'getAddress': {
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const derivationPath = `m/44'/637'/${accountIndex}'/0'/0'`;

			// Generate QR for address request
			const qrData = await qrHandler.generateSyncQr({
				action: 'get_address',
				chain: 'aptos',
				chainId: chainConfig.chainId || 'aptos',
				derivationPath,
				network,
			});

			results.push({
				json: {
					operation: 'getAddress',
					chain: 'aptos',
					network,
					derivationPath,
					accountIndex,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to get your Aptos address',
				},
			});
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateAptosAddress(address)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid Aptos address format. Must be 0x followed by 64 hex characters.',
				);
			}

			// In production, this would call the Aptos API
			// For now, return structure for the balance query
			results.push({
				json: {
					operation: 'getBalance',
					chain: 'aptos',
					network,
					address,
					rpcUrl,
					coinType: '0x1::aptos_coin::AptosCoin',
					apiEndpoint: `${rpcUrl}/accounts/${address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
					note: 'Query the API endpoint to get current balance',
				},
			});
			break;
		}

		case 'sendApt': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				maxGasAmount?: number;
				gasUnitPrice?: number;
				expirationSeconds?: number;
				sequenceNumber?: number;
			};

			if (!validateAptosAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Aptos address');
			}
			if (!validateAptosAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient Aptos address');
			}

			const amountOctas = aptToOctas(amount);

			// Build entry function payload for coin transfer
			const payload = {
				type: 'entry_function_payload',
				function: '0x1::coin::transfer',
				type_arguments: ['0x1::aptos_coin::AptosCoin'],
				arguments: [toAddress, amountOctas],
			};

			// Generate QR code for transaction signing
			const qrData = await qrHandler.generateTransactionQr({
				chain: 'aptos',
				chainId: chainConfig.chainId || 'aptos',
				from: fromAddress,
				to: toAddress,
				value: amountOctas,
				data: JSON.stringify(payload),
				type: 'aptos_entry_function',
				network,
				maxGasAmount: options.maxGasAmount || 200000,
				gasUnitPrice: options.gasUnitPrice || 100,
				expirationSeconds: options.expirationSeconds || 600,
			});

			results.push({
				json: {
					operation: 'sendApt',
					chain: 'aptos',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					amountOctas,
					payload,
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
			const decimals = this.getNodeParameter('decimals', index, 8) as number;
			const options = this.getNodeParameter('options', index, {}) as {
				maxGasAmount?: number;
				gasUnitPrice?: number;
				expirationSeconds?: number;
			};

			if (!validateAptosAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Aptos address');
			}
			if (!validateAptosAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient Aptos address');
			}

			const amountRaw = parseAmountWithDecimals(amount, decimals);

			const payload = {
				type: 'entry_function_payload',
				function: '0x1::coin::transfer',
				type_arguments: [coinType],
				arguments: [toAddress, amountRaw],
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'aptos',
				chainId: chainConfig.chainId || 'aptos',
				from: fromAddress,
				to: toAddress,
				value: amountRaw,
				data: JSON.stringify(payload),
				type: 'aptos_entry_function',
				network,
				coinType,
				maxGasAmount: options.maxGasAmount || 200000,
				gasUnitPrice: options.gasUnitPrice || 100,
			});

			results.push({
				json: {
					operation: 'sendCoin',
					chain: 'aptos',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					amountRaw,
					coinType,
					decimals,
					payload,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'getTokenBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const coinType = this.getNodeParameter('coinType', index) as string;

			if (!validateAptosAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Aptos address format');
			}

			const resourceType = `0x1::coin::CoinStore<${coinType}>`;

			results.push({
				json: {
					operation: 'getTokenBalance',
					chain: 'aptos',
					network,
					address,
					coinType,
					resourceType,
					apiEndpoint: `${rpcUrl}/accounts/${address}/resource/${encodeURIComponent(resourceType)}`,
					note: 'Query the API endpoint to get token balance',
				},
			});
			break;
		}

		case 'signMessage': {
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const message = this.getNodeParameter('message', index) as string;

			if (!validateAptosAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer Aptos address');
			}

			const qrData = await qrHandler.generateMessageQr({
				chain: 'aptos',
				chainId: chainConfig.chainId || 'aptos',
				address: signerAddress,
				message,
				type: 'aptos_message',
				network,
			});

			results.push({
				json: {
					operation: 'signMessage',
					chain: 'aptos',
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
			const rawTransaction = this.getNodeParameter('rawTransaction', index) as string;

			if (!validateAptosAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer Aptos address');
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'aptos',
				chainId: chainConfig.chainId || 'aptos',
				from: signerAddress,
				data: rawTransaction,
				type: 'aptos_raw_transaction',
				network,
			});

			results.push({
				json: {
					operation: 'signTransaction',
					chain: 'aptos',
					network,
					signerAddress,
					rawTransaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'callEntryFunction': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const moduleAddress = this.getNodeParameter('moduleAddress', index) as string;
			const moduleName = this.getNodeParameter('moduleName', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const typeArgumentsStr = this.getNodeParameter('typeArguments', index, '') as string;
			const functionArguments = this.getNodeParameter('functionArguments', index, '[]') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				maxGasAmount?: number;
				gasUnitPrice?: number;
				expirationSeconds?: number;
			};

			if (!validateAptosAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Aptos address');
			}

			const typeArguments = typeArgumentsStr ? typeArgumentsStr.split(',').map(t => t.trim()) : [];
			let parsedArguments: unknown[];
			try {
				parsedArguments = JSON.parse(functionArguments);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid function arguments JSON');
			}

			const payload = {
				type: 'entry_function_payload',
				function: `${moduleAddress}::${moduleName}::${functionName}`,
				type_arguments: typeArguments,
				arguments: parsedArguments,
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'aptos',
				chainId: chainConfig.chainId || 'aptos',
				from: fromAddress,
				data: JSON.stringify(payload),
				type: 'aptos_entry_function',
				network,
				maxGasAmount: options.maxGasAmount || 200000,
				gasUnitPrice: options.gasUnitPrice || 100,
			});

			results.push({
				json: {
					operation: 'callEntryFunction',
					chain: 'aptos',
					network,
					from: fromAddress,
					function: payload.function,
					typeArguments,
					arguments: parsedArguments,
					payload,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'getResources': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateAptosAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Aptos address format');
			}

			results.push({
				json: {
					operation: 'getResources',
					chain: 'aptos',
					network,
					address,
					apiEndpoint: `${rpcUrl}/accounts/${address}/resources`,
					note: 'Query the API endpoint to get all account resources',
				},
			});
			break;
		}

		case 'getTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;

			results.push({
				json: {
					operation: 'getTransaction',
					chain: 'aptos',
					network,
					txHash,
					apiEndpoint: `${rpcUrl}/transactions/by_hash/${txHash}`,
					explorerUrl: `https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`,
					note: 'Query the API endpoint to get transaction details',
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
export const description: INodeProperties[] = [...aptosOperations, ...aptosFields];
export const execute = executeAptos;
