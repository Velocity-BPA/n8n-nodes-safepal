/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getChainConfig, getCosmosChains } from '../../constants/chains';
import { validateCosmosAddress } from '../../utils/addressUtils';

const cosmosChainOptions = Object.entries(getCosmosChains()).map(([id, config]) => ({
	name: `${config.name} (${config.symbol})`,
	value: id,
}));

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['cosmos'],
			},
		},
		options: [
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get Cosmos address',
				action: 'Get Cosmos address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get token balance',
				action: 'Get balance',
			},
			{
				name: 'Send Tokens',
				value: 'sendTokens',
				description: 'Send native tokens',
				action: 'Send tokens',
			},
			{
				name: 'Delegate',
				value: 'delegate',
				description: 'Delegate tokens to validator',
				action: 'Delegate tokens',
			},
			{
				name: 'Undelegate',
				value: 'undelegate',
				description: 'Undelegate tokens from validator',
				action: 'Undelegate tokens',
			},
			{
				name: 'Claim Rewards',
				value: 'claimRewards',
				description: 'Claim staking rewards',
				action: 'Claim rewards',
			},
			{
				name: 'Get Delegations',
				value: 'getDelegations',
				description: 'Get delegation info',
				action: 'Get delegations',
			},
			{
				name: 'Get Validators',
				value: 'getValidators',
				description: 'Get validator list',
				action: 'Get validators',
			},
			{
				name: 'IBC Transfer',
				value: 'ibcTransfer',
				description: 'IBC cross-chain transfer',
				action: 'IBC transfer',
			},
		],
		default: 'getAddress',
	},
	// Cosmos chain selection
	{
		displayName: 'Chain',
		name: 'cosmosChain',
		type: 'options',
		options: cosmosChainOptions,
		default: 'cosmos',
		displayOptions: {
			show: {
				resource: ['cosmos'],
			},
		},
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['cosmos'],
				operation: ['getAddress', 'getBalance', 'getDelegations'],
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
				resource: ['cosmos'],
				operation: ['getBalance', 'getDelegations'],
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
				resource: ['cosmos'],
				operation: ['sendTokens', 'ibcTransfer'],
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
				resource: ['cosmos'],
				operation: ['sendTokens', 'delegate', 'undelegate', 'ibcTransfer'],
			},
		},
	},
	// Validator address
	{
		displayName: 'Validator Address',
		name: 'validatorAddress',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['cosmos'],
				operation: ['delegate', 'undelegate', 'claimRewards'],
			},
		},
	},
	// IBC channel
	{
		displayName: 'IBC Channel',
		name: 'ibcChannel',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['cosmos'],
				operation: ['ibcTransfer'],
			},
		},
		placeholder: 'channel-0',
	},
	// Destination chain
	{
		displayName: 'Destination Chain',
		name: 'destChain',
		type: 'options',
		options: cosmosChainOptions,
		default: 'osmosis',
		displayOptions: {
			show: {
				resource: ['cosmos'],
				operation: ['ibcTransfer'],
			},
		},
	},
	// Memo
	{
		displayName: 'Memo',
		name: 'memo',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['cosmos'],
				operation: ['sendTokens', 'delegate', 'ibcTransfer'],
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
	const cosmosChain = this.getNodeParameter('cosmosChain', index) as string;
	const chainConfig = getChainConfig(cosmosChain);

	if (!chainConfig) {
		throw new NodeOperationError(this.getNode(), `Unsupported chain: ${cosmosChain}`, { itemIndex: index });
	}

	// Generate mock Cosmos address
	const generateCosmosAddress = (prefix: string) => {
		const chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
		return prefix + '1' + Array(38).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
	};

	switch (operation) {
		case 'getAddress': {
			const accountIndex = this.getNodeParameter('accountIndex', index) as number;

			result = {
				success: true,
				chain: chainConfig.name,
				address: generateCosmosAddress(cosmosChain),
				derivationPath: `m/44'/118'/${accountIndex}'/0/0`,
				accountIndex,
			};
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;

			result = {
				success: true,
				chain: chainConfig.name,
				address,
				balances: [
					{
						denom: `u${chainConfig.symbol.toLowerCase()}`,
						amount: '0',
						symbol: chainConfig.symbol,
						decimals: chainConfig.decimals,
						displayAmount: '0.0',
					},
				],
			};
			break;
		}

		case 'sendTokens': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			const memo = this.getNodeParameter('memo', index, '') as string;

			const amountUbase = Math.floor(amount * Math.pow(10, chainConfig.decimals));

			result = {
				success: true,
				chain: chainConfig.name,
				to: toAddress,
				amount: amount.toString(),
				amountBase: amountUbase.toString(),
				denom: `u${chainConfig.symbol.toLowerCase()}`,
				memo,
				status: 'unsigned',
				message: 'Scan the QR code with your SafePal device to sign',
			};
			break;
		}

		case 'delegate': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			const memo = this.getNodeParameter('memo', index, '') as string;

			result = {
				success: true,
				chain: chainConfig.name,
				validator: validatorAddress,
				amount: amount.toString(),
				symbol: chainConfig.symbol,
				memo,
				status: 'unsigned',
				message: 'Delegation transaction prepared for signing',
			};
			break;
		}

		case 'undelegate': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;

			result = {
				success: true,
				chain: chainConfig.name,
				validator: validatorAddress,
				amount: amount.toString(),
				symbol: chainConfig.symbol,
				unbondingPeriod: '21 days',
				status: 'unsigned',
				message: 'Undelegation transaction prepared for signing',
			};
			break;
		}

		case 'claimRewards': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;

			result = {
				success: true,
				chain: chainConfig.name,
				validator: validatorAddress,
				estimatedRewards: '0.0',
				symbol: chainConfig.symbol,
				status: 'unsigned',
				message: 'Claim rewards transaction prepared for signing',
			};
			break;
		}

		case 'getDelegations': {
			const address = this.getNodeParameter('address', index) as string;

			result = {
				success: true,
				chain: chainConfig.name,
				address,
				delegations: [],
				totalStaked: '0.0',
				totalRewards: '0.0',
				symbol: chainConfig.symbol,
			};
			break;
		}

		case 'getValidators': {
			result = {
				success: true,
				chain: chainConfig.name,
				validators: [
					{
						address: `${cosmosChain}valoper1...`,
						name: 'Example Validator',
						commission: '5%',
						votingPower: '1000000',
						status: 'active',
					},
				],
				totalValidators: 1,
			};
			break;
		}

		case 'ibcTransfer': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			const ibcChannel = this.getNodeParameter('ibcChannel', index) as string;
			const destChain = this.getNodeParameter('destChain', index) as string;

			result = {
				success: true,
				chain: chainConfig.name,
				destChain,
				to: toAddress,
				amount: amount.toString(),
				symbol: chainConfig.symbol,
				channel: ibcChannel,
				status: 'unsigned',
				message: 'IBC transfer prepared for signing',
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
