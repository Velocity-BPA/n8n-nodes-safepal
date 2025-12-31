/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { 
	IDataObject,
	IExecuteFunctions, 
	INodeExecutionData, 
	INodeProperties 
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getChainConfig } from '../../constants/chains';
import { validateSolanaAddress } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['solana'],
			},
		},
		options: [
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get Solana address',
				action: 'Get Solana address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get SOL balance',
				action: 'Get SOL balance',
			},
			{
				name: 'Send SOL',
				value: 'sendSol',
				description: 'Create SOL transfer transaction',
				action: 'Send SOL',
			},
			{
				name: 'Send SPL Token',
				value: 'sendSplToken',
				description: 'Send SPL token',
				action: 'Send SPL token',
			},
			{
				name: 'Get Token Balance',
				value: 'getTokenBalance',
				description: 'Get SPL token balance',
				action: 'Get token balance',
			},
			{
				name: 'Get Token Accounts',
				value: 'getTokenAccounts',
				description: 'Get all token accounts',
				action: 'Get token accounts',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a message',
				action: 'Sign message',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a transaction',
				action: 'Sign transaction',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details',
				action: 'Get transaction',
			},
		],
		default: 'getAddress',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['getAddress', 'getBalance', 'getTokenAccounts'],
			},
		},
	},
	// Address
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['getBalance', 'getTokenBalance', 'getTokenAccounts'],
			},
		},
	},
	// To address
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['sendSol', 'sendSplToken'],
			},
		},
	},
	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 0,
		typeOptions: {
			numberPrecision: 9,
		},
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['sendSol', 'sendSplToken'],
			},
		},
	},
	// Token mint
	{
		displayName: 'Token Mint Address',
		name: 'tokenMint',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['sendSplToken', 'getTokenBalance'],
			},
		},
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['signMessage'],
			},
		},
	},
	// Transaction
	{
		displayName: 'Transaction (Base64)',
		name: 'transaction',
		type: 'string',
		default: '',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['signTransaction'],
			},
		},
	},
	// Transaction signature
	{
		displayName: 'Transaction Signature',
		name: 'signature',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['solana'],
				operation: ['getTransaction'],
			},
		},
	},
	// Network
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		options: [
			{ name: 'Mainnet', value: 'mainnet-beta' },
			{ name: 'Devnet', value: 'devnet' },
			{ name: 'Testnet', value: 'testnet' },
		],
		default: 'mainnet-beta',
		displayOptions: {
			show: {
				resource: ['solana'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	let result: IDataObject = {};
	const network = this.getNodeParameter('network', index, 'mainnet-beta') as string;
	const chainConfig = getChainConfig('solana')!;

	// Generate mock Solana address
	const generateSolanaAddress = () => {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
		return Array(44).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
	};

	switch (operation) {
		case 'getAddress': {
			const accountIndex = this.getNodeParameter('accountIndex', index) as number;

			result = {
				success: true,
				chain: 'Solana',
				address: generateSolanaAddress(),
				derivationPath: `m/44'/501'/${accountIndex}'/0'`,
				accountIndex,
				network,
			};
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;

			const validation = validateSolanaAddress(address);
			if (!validation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${validation.error}`, { itemIndex: index });
			}

			result = {
				success: true,
				chain: 'Solana',
				address,
				balance: '0.0',
				balanceLamports: '0',
				symbol: 'SOL',
				network,
			};
			break;
		}

		case 'sendSol': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;

			const validation = validateSolanaAddress(toAddress);
			if (!validation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${validation.error}`, { itemIndex: index });
			}

			const lamports = Math.floor(amount * 1e9);

			result = {
				success: true,
				chain: 'Solana',
				to: toAddress,
				amount: amount.toString(),
				lamports,
				status: 'unsigned',
				message: 'Scan the QR code with your SafePal device to sign',
				network,
			};
			break;
		}

		case 'sendSplToken': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			result = {
				success: true,
				chain: 'Solana',
				to: toAddress,
				tokenMint,
				amount: amount.toString(),
				status: 'unsigned',
				message: 'SPL token transfer prepared for signing',
				network,
			};
			break;
		}

		case 'getTokenBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			result = {
				success: true,
				chain: 'Solana',
				address,
				tokenMint,
				balance: '0.0',
				balanceRaw: '0',
				decimals: 9,
				network,
			};
			break;
		}

		case 'getTokenAccounts': {
			const address = this.getNodeParameter('address', index) as string;

			result = {
				success: true,
				chain: 'Solana',
				address,
				tokenAccounts: [],
				totalAccounts: 0,
				network,
			};
			break;
		}

		case 'signMessage': {
			const message = this.getNodeParameter('message', index) as string;

			result = {
				success: true,
				chain: 'Solana',
				message,
				status: 'pending_signature',
				qrData: {
					type: 'message',
					data: message,
				},
			};
			break;
		}

		case 'signTransaction': {
			const transaction = this.getNodeParameter('transaction', index) as string;

			result = {
				success: true,
				chain: 'Solana',
				transaction: transaction.substring(0, 50) + '...',
				status: 'pending_signature',
				message: 'Please approve on your SafePal device',
				network,
			};
			break;
		}

		case 'getTransaction': {
			const signature = this.getNodeParameter('signature', index) as string;

			result = {
				success: true,
				chain: 'Solana',
				signature,
				status: 'confirmed',
				slot: 200000000,
				blockTime: Date.now() / 1000,
				fee: 5000,
				explorerUrl: `https://solscan.io/tx/${signature}`,
				network,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
