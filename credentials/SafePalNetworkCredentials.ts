/**
 * @file SafePal Network Credentials
 * @description Credentials for blockchain network RPC configuration
 * @module n8n-nodes-safepal/credentials/SafePalNetwork
 *
 * SPDX-License-Identifier: BSL-1.1
 * Copyright (c) 2025 Velocity Business Partners LLC
 * Business Source License 1.1 - See LICENSE file for details
 * Licensed work: n8n-nodes-safepal
 * Change Date: 2029-01-01
 * Change License: GPL-3.0-or-later
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SafePalNetworkCredentials implements ICredentialType {
	name = 'safePalNetworkCredentials';
	displayName = 'SafePal Network';
	documentationUrl = 'https://docs.safepal.io/networks';
	icon = 'file:safepal.svg' as const;

	properties: INodeProperties[] = [
		// Ethereum RPC
		{
			displayName: 'Ethereum RPC URL',
			name: 'ethereumRpc',
			type: 'string',
			default: 'https://eth.llamarpc.com',
			description: 'Ethereum mainnet RPC endpoint',
		},
		{
			displayName: 'Ethereum Sepolia RPC URL',
			name: 'ethereumSepoliaRpc',
			type: 'string',
			default: 'https://ethereum-sepolia.publicnode.com',
			description: 'Ethereum Sepolia testnet RPC endpoint',
		},
		// BSC RPC
		{
			displayName: 'BNB Smart Chain RPC URL',
			name: 'bscRpc',
			type: 'string',
			default: 'https://bsc-dataseed.binance.org',
			description: 'BNB Smart Chain mainnet RPC endpoint',
		},
		{
			displayName: 'BSC Testnet RPC URL',
			name: 'bscTestnetRpc',
			type: 'string',
			default: 'https://data-seed-prebsc-1-s1.binance.org:8545',
			description: 'BNB Smart Chain testnet RPC endpoint',
		},
		// Polygon RPC
		{
			displayName: 'Polygon RPC URL',
			name: 'polygonRpc',
			type: 'string',
			default: 'https://polygon-rpc.com',
			description: 'Polygon mainnet RPC endpoint',
		},
		{
			displayName: 'Polygon Mumbai RPC URL',
			name: 'polygonMumbaiRpc',
			type: 'string',
			default: 'https://rpc-mumbai.maticvigil.com',
			description: 'Polygon Mumbai testnet RPC endpoint',
		},
		// Arbitrum RPC
		{
			displayName: 'Arbitrum One RPC URL',
			name: 'arbitrumRpc',
			type: 'string',
			default: 'https://arb1.arbitrum.io/rpc',
			description: 'Arbitrum One mainnet RPC endpoint',
		},
		// Optimism RPC
		{
			displayName: 'Optimism RPC URL',
			name: 'optimismRpc',
			type: 'string',
			default: 'https://mainnet.optimism.io',
			description: 'Optimism mainnet RPC endpoint',
		},
		// Avalanche RPC
		{
			displayName: 'Avalanche C-Chain RPC URL',
			name: 'avalancheRpc',
			type: 'string',
			default: 'https://api.avax.network/ext/bc/C/rpc',
			description: 'Avalanche C-Chain mainnet RPC endpoint',
		},
		// Base RPC
		{
			displayName: 'Base RPC URL',
			name: 'baseRpc',
			type: 'string',
			default: 'https://mainnet.base.org',
			description: 'Base mainnet RPC endpoint',
		},
		// Solana RPC
		{
			displayName: 'Solana RPC URL',
			name: 'solanaRpc',
			type: 'string',
			default: 'https://api.mainnet-beta.solana.com',
			description: 'Solana mainnet RPC endpoint',
		},
		{
			displayName: 'Solana Devnet RPC URL',
			name: 'solanaDevnetRpc',
			type: 'string',
			default: 'https://api.devnet.solana.com',
			description: 'Solana devnet RPC endpoint',
		},
		// Cosmos RPC
		{
			displayName: 'Cosmos Hub RPC URL',
			name: 'cosmosRpc',
			type: 'string',
			default: 'https://cosmos-rpc.quickapi.com:443',
			description: 'Cosmos Hub mainnet RPC endpoint',
		},
		// Tron RPC
		{
			displayName: 'Tron Full Node URL',
			name: 'tronRpc',
			type: 'string',
			default: 'https://api.trongrid.io',
			description: 'Tron mainnet full node endpoint',
		},
		// Bitcoin endpoints
		{
			displayName: 'Bitcoin API URL',
			name: 'bitcoinApi',
			type: 'string',
			default: 'https://blockstream.info/api',
			description: 'Bitcoin blockchain API endpoint',
		},
		{
			displayName: 'Bitcoin Testnet API URL',
			name: 'bitcoinTestnetApi',
			type: 'string',
			default: 'https://blockstream.info/testnet/api',
			description: 'Bitcoin testnet API endpoint',
		},
		// API Keys for premium services
		{
			displayName: 'Infura Project ID',
			name: 'infuraProjectId',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Infura project ID for enhanced RPC access',
		},
		{
			displayName: 'Alchemy API Key',
			name: 'alchemyApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Alchemy API key for enhanced RPC access',
		},
		{
			displayName: 'Etherscan API Key',
			name: 'etherscanApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Etherscan API key for contract verification and data',
		},
		{
			displayName: 'BSCScan API Key',
			name: 'bscscanApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'BSCScan API key for BNB Chain data',
		},
		{
			displayName: 'PolygonScan API Key',
			name: 'polygonscanApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'PolygonScan API key for Polygon data',
		},
		// WalletConnect
		{
			displayName: 'WalletConnect Project ID',
			name: 'walletConnectProjectId',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'WalletConnect Cloud project ID for DApp connections',
		},
		// Custom RPC section
		{
			displayName: 'Custom Networks',
			name: 'customNetworks',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			options: [
				{
					displayName: 'Network',
					name: 'network',
					values: [
						{
							displayName: 'Network Name',
							name: 'name',
							type: 'string',
							default: '',
							description: 'Custom network name',
						},
						{
							displayName: 'Chain ID',
							name: 'chainId',
							type: 'number',
							default: 1,
							description: 'EVM chain ID',
						},
						{
							displayName: 'RPC URL',
							name: 'rpcUrl',
							type: 'string',
							default: '',
							description: 'Network RPC endpoint',
						},
						{
							displayName: 'Symbol',
							name: 'symbol',
							type: 'string',
							default: '',
							description: 'Native currency symbol',
						},
						{
							displayName: 'Block Explorer URL',
							name: 'explorerUrl',
							type: 'string',
							default: '',
							description: 'Block explorer URL',
						},
					],
				},
			],
			description: 'Add custom EVM-compatible networks',
		},
		// Rate limiting
		{
			displayName: 'Rate Limit (requests/second)',
			name: 'rateLimit',
			type: 'number',
			default: 10,
			description: 'Maximum RPC requests per second',
		},
		{
			displayName: 'Request Timeout (ms)',
			name: 'timeout',
			type: 'number',
			default: 30000,
			description: 'RPC request timeout',
		},
	];

	// Network credentials use various authentication methods based on provider
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	// Test connection to primary Ethereum RPC
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.ethereumRpc}}',
			url: '',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_blockNumber',
				params: [],
				id: 1,
			}),
		},
	};
}
