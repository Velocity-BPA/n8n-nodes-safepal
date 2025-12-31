/**
 * @file SafePal Node
 * @description Main n8n node for SafePal hardware wallet integration
 * @module n8n-nodes-safepal/nodes/SafePal
 *
 * SPDX-License-Identifier: BSL-1.1
 * Copyright (c) 2025 Velocity Business Partners LLC
 * Business Source License 1.1 - See LICENSE file for details
 * Licensed work: n8n-nodes-safepal
 * Change Date: 2029-01-01
 * Change License: GPL-3.0-or-later
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { SUPPORTED_CHAINS, CHAIN_TYPE_OPTIONS, getChainConfig } from './constants/chains';
import { DEVICE_MODELS, CONNECTION_METHODS } from './constants/devices';

// Resource descriptions
import * as device from './actions/device';
import * as qrCode from './actions/qrCode';
import * as bluetooth from './actions/bluetooth';
import * as account from './actions/account';
import * as bitcoin from './actions/bitcoin';
import * as ethereum from './actions/ethereum';
import * as evmChains from './actions/evmChains';
import * as solana from './actions/solana';
import * as cosmos from './actions/cosmos';
import * as tron from './actions/tron';
import * as polkadot from './actions/polkadot';
import * as near from './actions/near';
import * as aptos from './actions/aptos';
import * as sui from './actions/sui';
import * as xrp from './actions/xrp';
import * as cardano from './actions/cardano';
import * as multiChain from './actions/multiChain';
import * as token from './actions/token';
import * as transaction from './actions/transaction';
import * as signing from './actions/signing';
import * as dapp from './actions/dapp';
import * as walletConnect from './actions/walletConnect';
import * as safePalApp from './actions/safePalApp';
import * as security from './actions/security';
import * as utility from './actions/utility';

export class SafePal implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SafePal',
		name: 'safePal',
		icon: 'file:safepal.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with SafePal hardware wallets supporting 54+ blockchains',
		defaults: {
			name: 'SafePal',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'safePalDeviceCredentials',
				required: false,
				displayOptions: {
					show: {
						resource: [
							'device',
							'qrCode',
							'bluetooth',
							'account',
							'bitcoin',
							'ethereum',
							'evmChains',
							'solana',
							'cosmos',
							'tron',
							'polkadot',
							'near',
							'aptos',
							'sui',
							'xrp',
							'cardano',
							'multiChain',
							'token',
							'transaction',
							'signing',
						],
					},
				},
			},
			{
				name: 'safePalAppCredentials',
				required: false,
				displayOptions: {
					show: {
						resource: ['safePalApp'],
					},
				},
			},
			{
				name: 'safePalNetworkCredentials',
				required: false,
				displayOptions: {
					show: {
						resource: [
							'ethereum',
							'evmChains',
							'solana',
							'cosmos',
							'tron',
							'token',
							'transaction',
							'dapp',
							'walletConnect',
						],
					},
				},
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					// Device & Connection
					{
						name: 'Device',
						value: 'device',
						description: 'Device management operations',
					},
					{
						name: 'QR Code',
						value: 'qrCode',
						description: 'QR code generation and parsing for air-gapped communication',
					},
					{
						name: 'Bluetooth',
						value: 'bluetooth',
						description: 'Bluetooth operations for SafePal X1',
					},
					// Account Management
					{
						name: 'Account',
						value: 'account',
						description: 'Multi-chain account management',
					},
					// Blockchain-specific
					{
						name: 'Bitcoin',
						value: 'bitcoin',
						description: 'Bitcoin and Bitcoin-family operations',
					},
					{
						name: 'Ethereum',
						value: 'ethereum',
						description: 'Ethereum mainnet operations',
					},
					{
						name: 'EVM Chains',
						value: 'evmChains',
						description: 'Operations for all EVM-compatible chains',
					},
					{
						name: 'Solana',
						value: 'solana',
						description: 'Solana blockchain operations',
					},
					{
						name: 'Cosmos',
						value: 'cosmos',
						description: 'Cosmos ecosystem operations',
					},
					{
						name: 'Tron',
						value: 'tron',
						description: 'Tron blockchain operations',
					},
					{
						name: 'Polkadot',
						value: 'polkadot',
						description: 'Polkadot and Kusama operations',
					},
					{
						name: 'Near',
						value: 'near',
						description: 'NEAR Protocol operations',
					},
					{
						name: 'Aptos',
						value: 'aptos',
						description: 'Aptos blockchain operations',
					},
					{
						name: 'Sui',
						value: 'sui',
						description: 'Sui blockchain operations',
					},
					{
						name: 'XRP',
						value: 'xrp',
						description: 'XRP Ledger operations',
					},
					{
						name: 'Cardano',
						value: 'cardano',
						description: 'Cardano blockchain operations',
					},
					// Multi-chain & Token
					{
						name: 'Multi-Chain',
						value: 'multiChain',
						description: 'Cross-chain and multi-chain operations',
					},
					{
						name: 'Token',
						value: 'token',
						description: 'Token management across chains',
					},
					// Transaction
					{
						name: 'Transaction',
						value: 'transaction',
						description: 'Transaction building and management',
					},
					// Signing
					{
						name: 'Signing',
						value: 'signing',
						description: 'Message and data signing operations',
					},
					// DApp Integration
					{
						name: 'DApp',
						value: 'dapp',
						description: 'DApp interaction operations',
					},
					{
						name: 'WalletConnect',
						value: 'walletConnect',
						description: 'WalletConnect v2 protocol operations',
					},
					// SafePal App
					{
						name: 'SafePal App',
						value: 'safePalApp',
						description: 'SafePal mobile app integration',
					},
					// Security & Utility
					{
						name: 'Security',
						value: 'security',
						description: 'Security and verification operations',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility and helper operations',
					},
				],
				default: 'device',
			},

			// ============ Device Operations ============
			...device.description,

			// ============ QR Code Operations ============
			...qrCode.description,

			// ============ Bluetooth Operations ============
			...bluetooth.description,

			// ============ Account Operations ============
			...account.description,

			// ============ Bitcoin Operations ============
			...bitcoin.description,

			// ============ Ethereum Operations ============
			...ethereum.description,

			// ============ EVM Chains Operations ============
			...evmChains.description,

			// ============ Solana Operations ============
			...solana.description,

			// ============ Cosmos Operations ============
			...cosmos.description,

			// ============ Tron Operations ============
			...tron.description,

			// ============ Polkadot Operations ============
			...polkadot.description,

			// ============ Near Operations ============
			...near.description,

			// ============ Aptos Operations ============
			...aptos.description,

			// ============ Sui Operations ============
			...sui.description,

			// ============ XRP Operations ============
			...xrp.description,

			// ============ Cardano Operations ============
			...cardano.description,

			// ============ Multi-Chain Operations ============
			...multiChain.description,

			// ============ Token Operations ============
			...token.description,

			// ============ Transaction Operations ============
			...transaction.description,

			// ============ Signing Operations ============
			...signing.description,

			// ============ DApp Operations ============
			...dapp.description,

			// ============ WalletConnect Operations ============
			...walletConnect.description,

			// ============ SafePal App Operations ============
			...safePalApp.description,

			// ============ Security Operations ============
			...security.description,

			// ============ Utility Operations ============
			...utility.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[] = [];

				switch (resource) {
					case 'device':
						result = await device.execute.call(this, i, operation);
						break;
					case 'qrCode':
						result = await qrCode.execute.call(this, i, operation);
						break;
					case 'bluetooth':
						result = await bluetooth.execute.call(this, i, operation);
						break;
					case 'account':
						result = await account.execute.call(this, i, operation);
						break;
					case 'bitcoin':
						result = await bitcoin.execute.call(this, i, operation);
						break;
					case 'ethereum':
						result = await ethereum.execute.call(this, i, operation);
						break;
					case 'evmChains':
						result = await evmChains.execute.call(this, i, operation);
						break;
					case 'solana':
						result = await solana.execute.call(this, i, operation);
						break;
					case 'cosmos':
						result = await cosmos.execute.call(this, i, operation);
						break;
					case 'tron':
						result = await tron.execute.call(this, i, operation);
						break;
					case 'polkadot':
						result = await polkadot.execute.call(this, i, operation);
						break;
					case 'near':
						result = await near.execute.call(this, i, operation);
						break;
					case 'aptos':
						result = await aptos.execute.call(this, i, operation);
						break;
					case 'sui':
						result = await sui.execute.call(this, i, operation);
						break;
					case 'xrp':
						result = await xrp.execute.call(this, i, operation);
						break;
					case 'cardano':
						result = await cardano.execute.call(this, i, operation);
						break;
					case 'multiChain':
						result = await multiChain.execute.call(this, i, operation);
						break;
					case 'token':
						result = await token.execute.call(this, i, operation);
						break;
					case 'transaction':
						result = await transaction.execute.call(this, i, operation);
						break;
					case 'signing':
						result = await signing.execute.call(this, i, operation);
						break;
					case 'dapp':
						result = await dapp.execute.call(this, i, operation);
						break;
					case 'walletConnect':
						result = await walletConnect.execute.call(this, i, operation);
						break;
					case 'safePalApp':
						result = await safePalApp.execute.call(this, i, operation);
						break;
					case 'security':
						result = await security.execute.call(this, i, operation);
						break;
					case 'utility':
						result = await utility.execute.call(this, i, operation);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown resource: ${resource}`,
							{ itemIndex: i },
						);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
