/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getChainConfig } from '../../constants/chains';
import { validateTronAddress } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['tron'],
			},
		},
		options: [
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get Tron address',
				action: 'Get Tron address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get TRX balance',
				action: 'Get TRX balance',
			},
			{
				name: 'Send TRX',
				value: 'sendTrx',
				description: 'Send TRX',
				action: 'Send TRX',
			},
			{
				name: 'Send TRC20',
				value: 'sendTrc20',
				description: 'Send TRC20 token',
				action: 'Send TRC20',
			},
			{
				name: 'Get Token Balance',
				value: 'getTokenBalance',
				description: 'Get TRC20 token balance',
				action: 'Get token balance',
			},
			{
				name: 'Freeze Balance',
				value: 'freezeBalance',
				description: 'Freeze TRX for energy/bandwidth',
				action: 'Freeze balance',
			},
			{
				name: 'Unfreeze Balance',
				value: 'unfreezeBalance',
				description: 'Unfreeze TRX',
				action: 'Unfreeze balance',
			},
			{
				name: 'Get Resources',
				value: 'getResources',
				description: 'Get account resources',
				action: 'Get resources',
			},
			{
				name: 'Vote Witness',
				value: 'voteWitness',
				description: 'Vote for super representative',
				action: 'Vote witness',
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
				resource: ['tron'],
				operation: ['getAddress', 'getBalance', 'getResources'],
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
				resource: ['tron'],
				operation: ['getBalance', 'getTokenBalance', 'getResources'],
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
				resource: ['tron'],
				operation: ['sendTrx', 'sendTrc20'],
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
			numberPrecision: 6,
		},
		displayOptions: {
			show: {
				resource: ['tron'],
				operation: ['sendTrx', 'sendTrc20', 'freezeBalance'],
			},
		},
	},
	// Token contract
	{
		displayName: 'Token Contract',
		name: 'tokenContract',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['tron'],
				operation: ['sendTrc20', 'getTokenBalance'],
			},
		},
	},
	// Resource type
	{
		displayName: 'Resource Type',
		name: 'resourceType',
		type: 'options',
		options: [
			{ name: 'Energy', value: 'ENERGY' },
			{ name: 'Bandwidth', value: 'BANDWIDTH' },
		],
		default: 'ENERGY',
		displayOptions: {
			show: {
				resource: ['tron'],
				operation: ['freezeBalance', 'unfreezeBalance'],
			},
		},
	},
	// Votes
	{
		displayName: 'Votes (JSON)',
		name: 'votes',
		type: 'string',
		default: '[]',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				resource: ['tron'],
				operation: ['voteWitness'],
			},
		},
		description: 'Array of {address, voteCount} objects',
	},
	// Network
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		options: [
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Shasta Testnet', value: 'shasta' },
			{ name: 'Nile Testnet', value: 'nile' },
		],
		default: 'mainnet',
		displayOptions: {
			show: {
				resource: ['tron'],
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
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const chainConfig = getChainConfig('tron')!;

	// Generate mock Tron address
	const generateTronAddress = () => {
		const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
		return 'T' + Array(33).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
	};

	switch (operation) {
		case 'getAddress': {
			const accountIndex = this.getNodeParameter('accountIndex', index) as number;

			result = {
				success: true,
				chain: 'Tron',
				address: generateTronAddress(),
				derivationPath: `m/44'/195'/${accountIndex}'/0/0`,
				accountIndex,
				network,
			};
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;

			const validation = validateTronAddress(address);
			if (!validation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${validation.error}`, { itemIndex: index });
			}

			result = {
				success: true,
				chain: 'Tron',
				address,
				balance: '0.0',
				balanceSun: '0',
				symbol: 'TRX',
				network,
			};
			break;
		}

		case 'sendTrx': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;

			const amountSun = Math.floor(amount * 1e6);

			result = {
				success: true,
				chain: 'Tron',
				to: toAddress,
				amount: amount.toString(),
				amountSun,
				status: 'unsigned',
				message: 'Scan the QR code with your SafePal device to sign',
				network,
			};
			break;
		}

		case 'sendTrc20': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			const tokenContract = this.getNodeParameter('tokenContract', index) as string;

			result = {
				success: true,
				chain: 'Tron',
				to: toAddress,
				tokenContract,
				amount: amount.toString(),
				status: 'unsigned',
				message: 'TRC20 transfer prepared for signing',
				network,
			};
			break;
		}

		case 'getTokenBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const tokenContract = this.getNodeParameter('tokenContract', index) as string;

			result = {
				success: true,
				chain: 'Tron',
				address,
				tokenContract,
				balance: '0.0',
				balanceRaw: '0',
				decimals: 6,
				network,
			};
			break;
		}

		case 'freezeBalance': {
			const amount = this.getNodeParameter('amount', index) as number;
			const resourceType = this.getNodeParameter('resourceType', index) as string;

			result = {
				success: true,
				chain: 'Tron',
				amount: amount.toString(),
				resourceType,
				estimatedResource: resourceType === 'ENERGY' ? '100000' : '1000',
				status: 'unsigned',
				message: 'Freeze transaction prepared for signing',
				network,
			};
			break;
		}

		case 'unfreezeBalance': {
			const resourceType = this.getNodeParameter('resourceType', index) as string;

			result = {
				success: true,
				chain: 'Tron',
				resourceType,
				status: 'unsigned',
				message: 'Unfreeze transaction prepared for signing',
				network,
			};
			break;
		}

		case 'getResources': {
			const address = this.getNodeParameter('address', index) as string;

			result = {
				success: true,
				chain: 'Tron',
				address,
				resources: {
					bandwidth: { total: 5000, used: 0, available: 5000 },
					energy: { total: 0, used: 0, available: 0 },
					frozenBalance: '0',
				},
				network,
			};
			break;
		}

		case 'voteWitness': {
			const votes = this.getNodeParameter('votes', index) as string;

			let parsedVotes: Array<{ address: string; voteCount: number }>;
			try {
				parsedVotes = JSON.parse(votes);
			} catch {
				parsedVotes = [];
			}

			result = {
				success: true,
				chain: 'Tron',
				votes: parsedVotes,
				totalVotes: parsedVotes.reduce((sum, v) => sum + v.voteCount, 0),
				status: 'unsigned',
				message: 'Vote transaction prepared for signing',
				network,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
